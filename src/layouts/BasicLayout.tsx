import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

const location = useLocation();
useEffect(() => {
   const baseTitle = "LifeGuard系统";
   const pathTitles = {
      "/new-overview": "人员总览",
      "/room/": "房间详情",
      // ...其他路径配置
   };

   // 当返回人员总览时主动更新标题
   if (location.pathname === "/new-overview") {
      document.title = `人员总览 | ${baseTitle}`;
   }
}, [location]);
