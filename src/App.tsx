import React, { useCallback, useMemo } from "react";
import { Layout, Menu, Button } from "antd";
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
import SmsManagement from "./components/SmsManagement";
import MiniManagement from "./components/MiniManagement";
import { useNavigate } from "react-router-dom"; // Import useNavigate hook
import PersonnelDetails from "./components/PersonnelManagement/PersonnelDetails";
import AlarmBanner from "./components/AlarmBanner";
import HistoryData from "./components/HistoryData";
import EntryExitManagement from "./components/EntryExitManagement";

const { Header, Content, Sider, Footer } = Layout;

const Logo = styled.img`
   height: 32px;
   margin: 16px;
`;

const App: React.FC = () => {
   const user = useSelector((state: RootState) => state.user);
   const { isAuthenticated, role, name } = user;
   const dispatch = useDispatch();
   const navigate = useNavigate(); // Get the useNavigate hook

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

   const handleLogout = useCallback(() => {
      dispatch(logout());
      navigate("/"); // Redirect to the login page
   }, [dispatch]);

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
                     element={isAuthenticated ? <RoomPage roomId={0} gender={""} age={0} /> : <Navigate to='/login' />}
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
