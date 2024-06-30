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
import PermissionManagement from "./components/PermissionManagement";
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

const { Header, Content, Sider, Footer } = Layout;

const Logo = styled.img`
   height: 32px;
   margin: 16px;
`;

const App: React.FC = () => {
   const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
   const dispatch = useDispatch();

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
            label: "历史数据",
            children: [
               { key: "alarm-display", icon: <AlertOutlined />, label: <Link to='/alarm-display'>报警信息</Link> },
            ],
         },
         {
            key: "settings",
            icon: <SettingOutlined />,
            label: "配置",
            children: [
               { key: "user-management", icon: <UserOutlined />, label: <Link to='/user-management'>用户管理</Link> },
               {
                  key: "permission-management",
                  icon: <UserOutlined />,
                  label: <Link to='/permission-management'>权限管理</Link>,
               },
               { key: "radar-management", icon: <UserOutlined />, label: <Link to='/radar-management'>雷达</Link> },
               { key: "room-management", icon: <UserOutlined />, label: <Link to='/room-management'>房间</Link> },
               {
                  key: "personnel-management",
                  icon: <UserOutlined />,
                  label: <Link to='/personnel-management'>人员信息</Link>,
               },
               { key: "alarm-settings", icon: <UserOutlined />, label: <Link to='/alarm-settings'>告警设置</Link> },
            ],
         },
      ],
      []
   );

   const handleLogout = useCallback(() => {
      dispatch(logout());
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
               <Logo src='/logo.png' alt='Logo' />
               <h1 style={{ margin: 0, color: "#fff" }}>My Dashboard</h1>
            </div>
            {isAuthenticated && (
               <div>
                  <span style={{ marginRight: "16px", color: "#fff" }}>用户名</span>
                  <Button type='primary' onClick={handleLogout}>
                     退出
                  </Button>
               </div>
            )}
         </Header>
         <Layout>
            {isAuthenticated && (
               <Sider collapsible style={{ background: "#002140" }}>
                  <Menu theme='dark' mode='inline' items={menuItems} />
               </Sider>
            )}
            <Layout>
               <Content style={{ margin: "16px" }}>
                  <Routes>
                     <Route path='/login' element={<Login />} />
                     <Route path='/overview' element={isAuthenticated ? <Overview /> : <Navigate to='/login' />} />
                     <Route
                        path='/entry-exit-management'
                        element={isAuthenticated ? <div>进出场管理页面</div> : <Navigate to='/login' />}
                     />
                     <Route
                        path='/user-management'
                        element={isAuthenticated ? <UserManagement /> : <Navigate to='/login' />}
                     />
                     <Route
                        path='/permission-management'
                        element={isAuthenticated ? <PermissionManagement /> : <Navigate to='/login' />}
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
                     <Route path='*' element={<Navigate to={isAuthenticated ? "/overview" : "/login"} />} />
                  </Routes>
               </Content>
               <Footer style={{ textAlign: "center", width: "100%" }}>©2024 My Dashboard. All Rights Reserved.</Footer>
            </Layout>
         </Layout>
      </Layout>
   );
};

export default React.memo(App);
