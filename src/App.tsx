// App.tsx

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Layout, Menu, Button, message } from "antd";
import {
   UserOutlined,
   AlertOutlined,
   DashboardOutlined,
   HistoryOutlined,
   SettingOutlined,
   TeamOutlined,
} from "@ant-design/icons";
import { Route, Routes, Link, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import UserManagement from "./components/UserManagement";
import AlarmDisplay from "./components/AlarmDisplay";
import RadarManagement from "./components/RadarManagement";
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
   clearAlarms,
   setRoomNetworkFailure,
   setRoomRadarFailure,
   setRoomRadarAbnormal,
} from "./store/dataSlice";
import config from "./config";

// 在组件外部设置全局配置
axios.defaults.withCredentials = true;

const { Header, Content, Sider, Footer } = Layout;

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
         { key: "overview", icon: <DashboardOutlined />, label: <Link to='/overview'>总览</Link> },
         {
            key: "entry-exit-management",
            icon: <TeamOutlined />,
            label: <Link to='/entry-exit-management'>进出场管理</Link>,
         },
         {
            key: "history",
            icon: <HistoryOutlined />,
            label: <Link to='/history-data'>历史数据</Link>,
         },
         { key: "alarm-display", icon: <AlertOutlined />, label: <Link to='/alarm-display'>报警信息</Link> },
         {
            key: "settings",
            icon: <SettingOutlined />,
            label: "配置",
            children: [
               { key: "user-management", icon: <UserOutlined />, label: <Link to='/user-management'>用户管理</Link> },
               { key: "radar-management", icon: <UserOutlined />, label: <Link to='/radar-management'>雷达</Link> },
               { key: "room-management", icon: <UserOutlined />, label: <Link to='/room-management'>房间</Link> },
               {
                  key: "personnel-management",
                  icon: <UserOutlined />,
                  label: <Link to='/personnel-management'>人员信息</Link>,
               },
               { key: "alarm-settings", icon: <UserOutlined />, label: <Link to='/alarm-settings'>报警设置</Link> },
            ],
         },
      ],
      []
   );

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
            }, 100); // Check every 100ms
         };

         // 设置 ws.onmessage 处理所有消息类型
         ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "subscribe") {
               // 处理订阅响应
               if (data.success) {
                  console.info(`Subscribed to ${data.topic}`);
               } else {
                  console.error(`Failed to subscribe to ${data.topic}: ${data.error}`);
               }
            } else if (data.type === "roomData") {
               dispatch(updateRoomData(data));
            } else if (data.type === "alertMessage") {
               dispatch(addAlarm(data));
            } else if (data.type === "networkFailure") {
               // 更新对应房间的网络故障状态
               dispatch(setRoomNetworkFailure({ roomId: data.roomId, status: true }));
            } else if (data.type === "radarFailure") {
               // 更新对应房间的网络故障状态
               dispatch(setRoomRadarFailure({ roomId: data.roomId, status: true }));
            } else if (data.type === "radarAbnormal") {
               // 更新对应房间的网络故障状态
               dispatch(setRoomRadarAbnormal({ roomId: data.roomId, status: true }));
            }
         };

         ws.onclose = () => {
            console.log("Disconnected from WebSocket server");
         };

         ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            // 添加错误处理逻辑，例如向用户显示错误消息或尝试重新连接
         };

         wsRef.current = ws; // Store the WebSocket instance in the ref
      };

      connectToWebSocket();
      // Cleanup function to close the WebSocket connection and unsubscribe
      return () => {
         if (wsRef.current) {
            // Unsubscribe from all subscribed topics (you'll need to implement this)
            //   unsubscribeFromAllTopics(wsRef.current);

            wsRef.current.close();
            wsRef.current = null; // Clear the reference
         }
      };
   }, [user.role, user.room_id, dispatch]);

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
               <Logo src='/images/logo2.png' alt='Logo' />
               <h1 style={{ margin: 0, color: "#fff" }}>生命体征监测系统</h1>
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
                     element={
                        isAuthenticated ? <RoomPage roomId={room_id} gender={""} age={0} /> : <Navigate to='/login' />
                     }
                  />
               </Routes>
            )}
            {role === "admin" && (
               <Sider collapsible style={{ background: "#002140" }}>
                  <Menu theme='dark' mode='inline' items={menuItems} />
               </Sider>
            )}
            {role === "admin" && (
               <Layout>
                  <Content style={{ margin: "16px" }}>
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
                           path='/radar-management'
                           element={isAuthenticated ? <RadarManagement /> : <Navigate to='/login' />}
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
                  </Content>
                  <AlarmBanner /> {/* 在布局底部添加 AlarmBanner */}
                  <Footer style={{ textAlign: "center", width: "100%", color: "rgba(0, 0, 0, 0.45)" }}>
                     2024 浙江骊三科技有限公司 ©️版权所有
                  </Footer>
               </Layout>
            )}
         </Layout>
      </Layout>
   );
};

export default React.memo(App);
