// App.tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layout, Menu, Button, message } from "antd";
import { UserOutlined, AlertOutlined, DashboardOutlined, HistoryOutlined, SettingOutlined } from "@ant-design/icons";
import { Route, Routes, Link, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import UserManagement from "./components/UserManagement";
import AlarmDisplay from "./components/AlarmDisplay";
import RoomManagement from "./components/RoomManagement";
import PersonnelManagement from "./components/PersonnelManagement/index";
import AlarmSettings from "./components/AlarmSettings";
import Overview from "./components/Overview/index";
import Login from "./pages/Login";
import styled from "styled-components";
import { RootState } from "./store";
import { logout } from "./store/userSlice";
import RoomPage from "./pages/Room";
import { useNavigate } from "react-router-dom"; // Import useNavigate hook
import PersonnelDetails from "./components/PersonnelManagement/PersonnelDetails";
import AlarmBanner from "./components/AlarmBanner";
import HistoryData from "./components/HistoryData";
import EntryExitManagement from "./components/EntryExitManagement";
import axios from "axios";
import {
   updateRoomData,
   addAlarm,
   setRoomNetworkFailure,
   setRoomRadarFailure,
   setRoomRadarAbnormal,
   setRooms,
} from "./store/dataSlice";
import config from "./config";
import { Room } from "./types";

// 在组件外部设置全局配置
axios.defaults.withCredentials = true;

const { Header, Content, Sider, Footer } = Layout;

const ENVIRONMENT_THRESHOLD = process.env.REACT_APP_ENVIRONMENT_THRESHOLD || 10;

const Logo = styled.img`
   height: 32px;
   margin: 16px;
`;

const App: React.FC = () => {
   const user = useSelector((state: RootState) => state.user);
   const { isAuthenticated, role, name, room_id } = user;
   const dispatch = useDispatch();
   const navigate = useNavigate(); // Get the useNavigate hook
   const wsRef = useRef<WebSocket | null>(null);

   const menuItems = useMemo(
      () => [
         { key: "overview", icon: <DashboardOutlined />, label: <Link to='/overview'>实时总览</Link> },
         {
            key: "history",
            icon: <HistoryOutlined />,
            label: <Link to='/history-data'>历史统计</Link>,
         },
         { key: "alarm-display", icon: <AlertOutlined />, label: <Link to='/alarm-display'>报警分析</Link> },
         {
            key: "personnel-management",
            icon: <UserOutlined />,
            label: <Link to='/personnel-management'>人员管理</Link>,
         },
         {
            key: "settings",
            icon: <SettingOutlined />,
            label: "系统配置",
            children: [
               { key: "room-management", icon: <UserOutlined />, label: <Link to='/room-management'>房间配置</Link> },
               { key: "alarm-settings", icon: <UserOutlined />, label: <Link to='/alarm-settings'>报警配置</Link> },
               { key: "user-management", icon: <UserOutlined />, label: <Link to='/user-management'>权限管理</Link> },
            ],
         },
      ],
      []
   );

   const [BRAND_CONFIG, setBRAND_CONFIG] = useState({
      PRODUCT_NAME: "生命体征监测系统2",
      PRODUCT_LOGO: "LifeGuard.png",
      COMPANY_NAME: "浙江虎格电气有限公司",
   });
   useEffect(() => {
      fetch(`/brand.json`)
         .then((response) => response.json())
         .then((data) => setBRAND_CONFIG(data))
         .catch((error) => console.error("Error fetching JSON data:", error));
   }, []);

   const handleLogout = useCallback(async () => {
      try {
         await axios.post(`${config.backend.url}/logout`); // Call the logout API
         dispatch(logout());
         navigate("/");
      } catch (error) {
         console.error("Logout error:", error);
         message.error("退出登录失败");
      }
   }, [dispatch, navigate]);

   useEffect(() => {
      let ws: WebSocket | null = null;
      let reconnectTimeout: NodeJS.Timeout | null = null; // Timer for reconnection
      const INITIAL_RECONNECT_DELAY = 1000; // Initial delay before first reconnection attempt
      const RECONNECT_DELAY_MULTIPLIER = 2; // Multiplier for increasing delay between reconnection attempts
      let currentReconnectDelay = INITIAL_RECONNECT_DELAY; // Start with base delay

      const connectToWebSocket = () => {
         console.log("Connecting to WebSocket server...", `${config.backend.ws_url}`);
         ws = new WebSocket(`${config.backend.ws_url}`);

         ws.onopen = () => {
            console.log("Connected to WebSocket server");

            // Wait for the connection to be fully open (readyState === 1)
            const waitForOpenConnection = setInterval(() => {
               console.log("Waiting for WebSocket connection to be open...");
               if (ws?.readyState === WebSocket.OPEN) {
                  console.log("WebSocket connection is open.");
                  clearInterval(waitForOpenConnection);

                  // Subscribe to all rooms or specific rooms based on user role
                  if (user.role === "admin") {
                     ws?.send(JSON.stringify({ type: "subscribe", topic: "/rooms/all" }));
                  } else if (user.role === "user" && user.room_id) {
                     ws?.send(JSON.stringify({ type: "subscribe", topic: `/rooms/${user.room_id}` }));
                  } else {
                     console.log("no role");
                  }
               }
            }, currentReconnectDelay); // Check every 100ms
         };

         // 设置 ws.onmessage 处理所有消息类型
         ws.onmessage = (event) => {
            if (!user?.room_id && user.role !== "admin") return;
            const data = JSON.parse(event.data);
            const { roomId } = data;
            if (roomId !== undefined && roomId !== user.room_id && user.role !== "admin") return;

            if (data.type === "subscribe") {
               // 处理订阅响应
               if (data.success) {
                  console.info(`Subscribed to ${data.topic}`);
                  dispatch(setRoomNetworkFailure({ roomId: data.roomId, status: false }));
               } else {
                  console.error(`Failed to subscribe to ${data.topic}: ${data.error}`);
               }
            } else if (data.type === "roomData") {
               if (data.data.environment > ENVIRONMENT_THRESHOLD || parseInt(data.data.environment) === 0) {
                  dispatch(updateRoomData(data));
                  dispatch(setRoomNetworkFailure({ roomId: data.roomId, status: false }));
               } else {
               }
            } else if (data.type === "alertMessage") {
               dispatch(addAlarm(data));
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
            console.log("Disconnected from WebSocket server");
            reconnectTimeout && clearTimeout(reconnectTimeout); // Clear any existing timeout

            // Implement exponential backoff strategy for reconnection attempts
            reconnectTimeout = setTimeout(connectToWebSocket, currentReconnectDelay);
         };

         ws.onerror = (error) => {
            message.error("实时数据服务连接错误！");
            currentReconnectDelay *= currentReconnectDelay > 10000 ? 1 : RECONNECT_DELAY_MULTIPLIER; // Double delay each time
         };

         wsRef.current = ws; // Store the WebSocket instance in the ref
      };

      if (user.isAuthenticated) connectToWebSocket();
      // Cleanup function to close the WebSocket connection and unsubscribe
      return () => {
         if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null; // Clear the reference
         }
      };
   }, [user.role, user.room_id, dispatch]);

   useEffect(() => {
      if (!isAuthenticated) return;
      const fetchRooms = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/rooms`);
            const roomsData = response.data.map((room: Room) => ({
               ...room,
               enabled: room.enabled,
            }));
            dispatch(setRooms(roomsData || [])); // Dispatch the setRooms action
         } catch (error) {
            console.error("Error fetching rooms:", error);
            message.error("获取房间信息失败！");
         }
      };

      fetchRooms();
   }, [isAuthenticated]);

   return (
      <Layout style={{ minHeight: "100vh" }}>
         <Header
            style={{
               background: "#001529",
               padding: 0,
               display: "flex",
               justifyContent: "space-between",
               alignItems: "center",
               width: "100%",
            }}
         >
            <div style={{ display: "flex", alignItems: "center" }}>
               <Logo src={"/images/" + BRAND_CONFIG.PRODUCT_LOGO} alt='Logo' />
               <h1 style={{ margin: 0, color: "#fff" }}>{BRAND_CONFIG.PRODUCT_NAME}</h1>
            </div>
            {isAuthenticated && (
               <div style={{ marginRight: "16px" }}>
                  <span style={{ marginRight: "16px", color: "#fff" }}>{name}</span>
                  <Button type='primary' onClick={handleLogout}>
                     退出
                  </Button>
               </div>
            )}
         </Header>
         <Layout>
            {!isAuthenticated && (
               <Routes>
                  <Route path='/login' element={<Login />} />
                  <Route path='*' element={<Login />} />
               </Routes>
            )}
            {role === "user" && (
               <Routes>
                  <Route path='/login' element={<Login />} />
                  <Route
                     path='/room'
                     element={isAuthenticated ? <RoomPage roomId={room_id} /> : <Navigate to='/login' />}
                  />
               </Routes>
            )}
            {role === "admin" && (
               <Sider collapsible style={{ background: "#002140" }}>
                  <Menu theme='dark' mode='inline' items={menuItems} />
               </Sider>
            )}
            <Layout>
               <Content style={{ margin: "16px" }}>
                  {role === "admin" && (
                     <Routes>
                        <Route path='/login' element={<Login />} />
                        <Route path='/overview' element={isAuthenticated ? <Overview /> : <Navigate to='/login' />} />
                        <Route
                           path='/entry-exit-management'
                           element={isAuthenticated ? <EntryExitManagement /> : <Navigate to='/login' />}
                        />
                        <Route
                           path='/user-management'
                           element={isAuthenticated ? <UserManagement /> : <Navigate to='/login' />}
                        />
                        <Route
                           path='/room-management'
                           element={isAuthenticated ? <RoomManagement /> : <Navigate to='/login' />}
                        />
                        <Route
                           path='/personnel-management'
                           element={isAuthenticated ? <PersonnelManagement /> : <Navigate to='/login' />}
                        />
                        <Route
                           path='/alarm-settings'
                           element={isAuthenticated ? <AlarmSettings /> : <Navigate to='/login' />}
                        />
                        <Route
                           path='/alarm-display'
                           element={isAuthenticated ? <AlarmDisplay /> : <Navigate to='/login' />}
                        />
                        <Route
                           path='/history-data'
                           element={isAuthenticated ? <HistoryData /> : <Navigate to='/login' />}
                        />
                        <Route
                           path='/personnel-management/:id' // Route with personnel ID parameter
                           element={isAuthenticated ? <PersonnelDetails /> : <Navigate to='/login' />}
                        />
                        <Route path='*' element={<Navigate to={isAuthenticated ? "/overview" : "/login"} />} />
                     </Routes>
                  )}
                  {isAuthenticated && <AlarmBanner />}
               </Content>
               <Footer style={{ textAlign: "center", width: "100%", color: "rgba(0, 0, 0, 0.45)" }}>
                  {new Date().getFullYear()} {BRAND_CONFIG?.COMPANY_NAME} 版权所有
               </Footer>
            </Layout>
         </Layout>
      </Layout>
   );
};

export default React.memo(App);
