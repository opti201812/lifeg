import React, { useEffect, useState } from "react";
import { Layout, Menu, Button, message } from "antd";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import styled from "styled-components";
import { RootState } from "../store";
import { logout } from "../store/userSlice";
import config from "../config";
import AlarmBanner from "../components/AlarmBanner";
import DashboardRoutes from "../routes/DashboardRoutes";
import { WebSocketHandler } from "../services";
import SidebarMenu from "../components/SidebarMenu/index";

const { Header, Content, Sider, Footer } = Layout;

const Logo = styled.img`
   height: 32px;
   margin: 16px;
`;

const MainLayout: React.FC = () => {
   const user = useSelector((state: RootState) => state.user);
   const { isAuthenticated, role, name } = user;
   const dispatch = useDispatch();
   const navigate = useNavigate();
   const [version, setVersion] = useState("");

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

   useEffect(() => {
      const fetchVersion = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/version`);
            setVersion(response.data.version);
         } catch (error) {
            console.error("Error fetching version:", error);
         }
      };
      fetchVersion();
   }, []);

   const handleLogout = async () => {
      try {
         await axios.post(
            `${config.backend.url}/logout`,
            {},
            {
               headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
               withCredentials: true, // 确保携带Cookie
            }
         );
         // 清除所有客户端存储
         localStorage.removeItem("token");
         sessionStorage.clear();
         document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;"; // 强制清除Cookie
         dispatch(logout());
         window.location.href = "/login"; // 强制刷新页面
      } catch (error) {
         console.error("Logout error:", error);
         message.error("退出登录失败");
         // 即使API失败也强制清除
         document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
         window.location.href = "/login";
      }
   };

   return (
      <>
         <WebSocketHandler />
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
                  <h1 style={{ margin: 0, color: "#fff" }}>
                     {BRAND_CONFIG.PRODUCT_NAME} {version?.split(".").slice(0, 2).join(".")}
                  </h1>
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
               {role === "admin" && (
                  <Sider collapsible style={{ background: "#002140", height: "calc(100vh - 64px)" }}>
                     <SidebarMenu />
                  </Sider>
               )}
               <Layout>
                  <Content style={{ margin: "24px 16px 0", overflow: "initial" }}>
                     <DashboardRoutes />
                     {isAuthenticated && <AlarmBanner />}
                  </Content>
                  <Footer style={{ textAlign: "center", width: "100%", color: "rgba(0, 0, 0, 0.45)" }}>
                     {new Date().getFullYear()} {BRAND_CONFIG?.COMPANY_NAME} 版权所有 {version}
                  </Footer>
               </Layout>
            </Layout>
         </Layout>
      </>
   );
};

export default MainLayout;
