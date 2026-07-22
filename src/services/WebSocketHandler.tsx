import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { message } from "antd";
import axios from "axios";
import { RootState } from "../store";
import config from "../config";
import {
   updateRoomData,
   addAlarm,
   setRoomNetworkFailure,
   setRoomRadarFailure,
   setRoomRadarAbnormal,
   setRooms,
   removeAlarm,
   updatePersonnelDeviceData,
} from "../store/dataSlice";
import { WebSocketMessage, Room } from "../types";

const ENVIRONMENT_THRESHOLD = process.env.REACT_APP_ENVIRONMENT_THRESHOLD || 10;

const WebSocketHandler: React.FC = () => {
   const user = useSelector((state: RootState) => state.user);
   const dispatch = useDispatch();
   const wsRef = useRef<WebSocket | null>(null);

   // 处理房间数据获取
   useEffect(() => {
      if (!user.isAuthenticated) return;

      const fetchRooms = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/rooms`);
            const roomsData = (response.data?.data || response.data || []).map((room: Room) => ({
               ...room,
            }));
            dispatch(setRooms(roomsData || []));
         } catch (error) {
            console.error("Error fetching rooms:", error);
            message.error("获取房间信息失败！");
         }
      };

      fetchRooms();
   }, [user.isAuthenticated, dispatch]);

   // 统一的WebSocket连接处理（合并了房间数据和人员数据）
   useEffect(() => {
      let ws: WebSocket | null = null;
      let reconnectTimeout: NodeJS.Timeout | null = null;
      const INITIAL_RECONNECT_DELAY = 1000;
      const RECONNECT_DELAY_MULTIPLIER = 2;
      let currentReconnectDelay = INITIAL_RECONNECT_DELAY;

      const connectToWebSocket = () => {
         // 获取认证令牌（优先从 sessionStorage，因为登录后存储在那里）
         const token = sessionStorage.getItem("token") || localStorage.getItem("token");

         // 构建WebSocket URL，将令牌作为查询参数传递
         // 注意：WebSocket 连接时浏览器不会自动发送 Cookie，所以必须通过 URL 参数传递 token
         const wsUrl = token
            ? `${config.backend.ws_url}?token=${encodeURIComponent(token)}`
            : `${config.backend.ws_url}`;

         console.log(
            "[WebSocket] 正在连接到",
            wsUrl.split("?")[0],
            "用户角色:",
            user.role,
            "有令牌:",
            !!token,
            "令牌长度:",
            token?.length || 0,
         );
         if (token) {
            console.log("[WebSocket] Token 前10个字符:", token.substring(0, 10) + "...");
         } else {
            console.warn("[WebSocket] ⚠️ 未找到 token，WebSocket 连接可能失败");
         }
         ws = new WebSocket(wsUrl);

         ws.onopen = () => {
            console.log("[WebSocket] 连接已打开，等待服务器认证响应");
            currentReconnectDelay = INITIAL_RECONNECT_DELAY;
            // 令牌已在URL中作为查询参数发送，等待服务器响应连接消息
         };

         ws.onmessage = (event) => {
            try {
               const data = JSON.parse(event.data);

               // 处理连接消息，检查认证状态
               if (data.type === "connection") {
                  if (!data.success) {
                     console.error("[WebSocket] 认证失败:", data.message);
                     message.error("实时数据服务认证失败，请重新登录");
                     // 关闭连接并触发重新连接逻辑
                     ws?.close();
                     return;
                  }
                  console.log("[WebSocket] 认证成功，用户角色:", data.role);

                  // 认证成功后发送subscribe消息
                  if (user.role === "admin") {
                     console.log("[WebSocket] 作为admin发送subscribe到/rooms/all");
                     ws?.send(JSON.stringify({ type: "subscribe", topic: "/rooms/all" }));
                  } else if (user.role === "user" && user.room_id) {
                     console.log("[WebSocket] 作为user发送subscribe到/rooms/" + user.room_id);
                     ws?.send(JSON.stringify({ type: "subscribe", topic: `/rooms/${user.room_id}` }));
                  } else {
                     console.warn("[WebSocket] 无法发送subscribe，缺少必要的角色或房间信息", {
                        role: user.role,
                        room_id: user.room_id,
                     });
                  }
                  return;
               }

               // 处理订阅响应
               if (data.type === "subscribe") {
                  if (data.success) {
                     dispatch(setRoomNetworkFailure({ roomId: data.roomId, status: false }));
                  }
                  return;
               }

               // 处理人员设备数据（deviceData）- 不需要房间过滤
               if (data.type === "deviceData") {
                  const deviceData = data.data as Record<string, any[]>;
                  Object.entries(deviceData).forEach(([personnelId, dataArray]) => {
                     if (!Array.isArray(dataArray) || dataArray.length === 0) return;

                     // 直接更新 Redux，使用最新数据
                     const latestData = dataArray[dataArray.length - 1];
                     dispatch(
                        updatePersonnelDeviceData({
                           personnelId: parseInt(personnelId),
                           data: {
                              devices: latestData.devices,
                              timestamp: latestData.timestamp || Date.now(),
                           },
                        }),
                     );
                  });
                  return;
               }

               // 处理人员报警数据（alertData）- 不需要房间过滤
               if (data.type === "alertData") {
                  const alertData = data.data as Record<string, any[]>;
                  Object.entries(alertData).forEach(([personnelId, dataArray]) => {
                     if (!Array.isArray(dataArray)) return;

                     dataArray.forEach((alertItem) => {
                        dispatch(
                           addAlarm({
                              personnelId: parseInt(personnelId),
                              ...alertItem,
                           }),
                        );
                     });
                  });
                  return;
               }

               // 处理房间相关消息（需要房间过滤）
               if (!user?.room_id && user.role !== "admin") return;
               const { roomId } = data;
               if (roomId !== undefined && roomId !== user.room_id && user.role !== "admin") return;

               if (data.type === "roomData") {
                  if (data.data.environment > ENVIRONMENT_THRESHOLD || parseInt(data.data.environment) === 0) {
                     dispatch(updateRoomData(data));
                     dispatch(setRoomNetworkFailure({ roomId: data.roomId, status: false }));
                  }
               } else if (data.type === "alertMessage" || data.type === "invalidLicense") {
                  const alarmId = data.id;
                  dispatch(addAlarm({ roomId, ...data }));

                  setTimeout(() => {
                     dispatch(removeAlarm(alarmId));
                  }, 4800);
                  dispatch(setRoomNetworkFailure({ roomId: data.roomId, status: false }));
               } else if (data.type === "networkFailure") {
                  dispatch(setRoomNetworkFailure({ roomId: data.roomId, status: true }));
               } else if (data.type === "radarFailure") {
                  dispatch(setRoomRadarFailure({ roomId: data.roomId, status: true }));
               } else if (data.type === "radarAbnormal") {
                  dispatch(setRoomRadarAbnormal({ roomId: data.roomId, status: true }));
               } else {
                  console.warn(`[WebSocket] 未知的消息类型: ${data.type}`);
               }
            } catch (error) {
               console.error("解析WebSocket消息失败:", error);
            }
         };

         ws.onclose = () => {
            // 检查是否有 token，如果没有则不重连
            const token = sessionStorage.getItem("token") || localStorage.getItem("token");
            if (!token) {
               console.warn("[WebSocket] 连接关闭，但未找到 token，停止重连");
               return;
            }

            reconnectTimeout && clearTimeout(reconnectTimeout);
            reconnectTimeout = setTimeout(connectToWebSocket, currentReconnectDelay);
            currentReconnectDelay = Math.min(currentReconnectDelay * RECONNECT_DELAY_MULTIPLIER, 30000);
         };

         ws.onerror = (error) => {
            console.error("[WebSocket] 连接错误:", error);
            message.error("实时数据服务连接错误！");
            currentReconnectDelay *= currentReconnectDelay > 10000 ? 1 : RECONNECT_DELAY_MULTIPLIER;
         };

         wsRef.current = ws;
      };

      // 只在用户已登录时连接
      if (user.isAuthenticated) {
         connectToWebSocket();
      }

      return () => {
         if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
         }
         if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
         }
      };
   }, [user.role, user.room_id, user.isAuthenticated, dispatch]);

   return null;
};

export default WebSocketHandler;
