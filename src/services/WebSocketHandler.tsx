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
            const roomsData = response.data.map((room: Room) => ({
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

   // 主WebSocket连接处理
   useEffect(() => {
      let ws: WebSocket | null = null;
      let reconnectTimeout: NodeJS.Timeout | null = null;
      const INITIAL_RECONNECT_DELAY = 1000;
      const RECONNECT_DELAY_MULTIPLIER = 2;
      let currentReconnectDelay = INITIAL_RECONNECT_DELAY;

      const connectToWebSocket = () => {
         ws = new WebSocket(`${config.backend.ws_url}`);

         ws.onopen = () => {
            const waitForOpenConnection = setInterval(() => {
               if (ws?.readyState === WebSocket.OPEN) {
                  clearInterval(waitForOpenConnection);

                  if (user.role === "admin") {
                     ws?.send(JSON.stringify({ type: "subscribe", topic: "/rooms/all" }));
                  } else if (user.role === "user" && user.room_id) {
                     ws?.send(JSON.stringify({ type: "subscribe", topic: `/rooms/${user.room_id}` }));
                  }
               }
            }, 100);
         };

         ws.onmessage = (event) => {
            if (!user?.room_id && user.role !== "admin") return;
            const data = JSON.parse(event.data);
            const { roomId } = data;
            if (roomId !== undefined && roomId !== user.room_id && user.role !== "admin") return;

            if (data.type === "subscribe") {
               if (data.success) {
                  dispatch(setRoomNetworkFailure({ roomId: data.roomId, status: false }));
               }
            } else if (data.type === "roomData") {
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
            }
         };

         ws.onclose = () => {
            reconnectTimeout && clearTimeout(reconnectTimeout);
            reconnectTimeout = setTimeout(connectToWebSocket, currentReconnectDelay);
         };

         ws.onerror = (error) => {
            message.error("实时数据服务连接错误！");
            currentReconnectDelay *= currentReconnectDelay > 10000 ? 1 : RECONNECT_DELAY_MULTIPLIER;
         };

         wsRef.current = ws;
      };

      if (user.isAuthenticated) connectToWebSocket();

      return () => {
         if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
         }
      };
   }, [user.role, user.room_id, user.isAuthenticated, dispatch]);

   // 处理人员数据更新WebSocket
   useEffect(() => {
      let ws: WebSocket | null = null;
      let reconnectTimeout: NodeJS.Timeout | null = null;
      const INITIAL_RECONNECT_DELAY = 1000;
      const RECONNECT_DELAY_MULTIPLIER = 2;
      let currentReconnectDelay = INITIAL_RECONNECT_DELAY;

      const connectToWebSocket = () => {
         ws = new WebSocket(config.backend.ws_url);

         ws.onopen = () => {
            currentReconnectDelay = INITIAL_RECONNECT_DELAY;
         };

         ws.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "deviceData") {
               const data = message.data as Record<string, any[]>;

               Object.entries(data).forEach(([personnelId, dataArray]) => {
                  if (!Array.isArray(dataArray)) return;

                  const latestData = dataArray[dataArray.length - 1];

                  if (latestData.devices) {
                     dispatch(
                        updatePersonnelDeviceData({
                           personnelId: parseInt(personnelId),
                           data: latestData,
                        })
                     );
                  }
               });
            } else if (message.type === "alertData") {
               const data = message.data as Record<string, any[]>;

               Object.entries(data).forEach(([personnelId, dataArray]) => {
                  if (!Array.isArray(dataArray)) return;

                  dataArray.forEach((alertData) => {
                     dispatch(
                        addAlarm({
                           personnelId: parseInt(personnelId),
                           ...alertData,
                        })
                     );
                  });
               });
            }
            // 处理连接成功响应
            else if (message.type === "connection") {
               console.log(`WebSocket连接: ${message.success ? "成功" : "失败"}`);
            } else {
               console.warn(`未知的WebSocket消息类型: ${message.type}`);
            }
         };

         ws.onerror = (error) => {
            message.error("实时数据服务连接错误！");
         };

         ws.onclose = () => {
            if (reconnectTimeout) {
               clearTimeout(reconnectTimeout);
            }
            reconnectTimeout = setTimeout(connectToWebSocket, currentReconnectDelay);
            currentReconnectDelay = Math.min(currentReconnectDelay * RECONNECT_DELAY_MULTIPLIER, 30000);
         };
      };

      connectToWebSocket();

      return () => {
         if (ws) {
            ws.close();
         }
         if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
         }
      };
   }, [dispatch]);

   return null;
};

export default WebSocketHandler;
