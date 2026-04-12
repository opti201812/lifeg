import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BasicLayoutTitleUpdater: React.FC = () => {
   const location = useLocation();
   useEffect(() => {
      const baseTitle = "LifeGuard系统";
      const pathTitles: Record<string, string> = {
         "/overview": "人员总览",
         "/room/": "房间详情",
      };
      Object.keys(pathTitles).forEach((path) => {
         if (location.pathname.startsWith(path)) {
            document.title = `${pathTitles[path]} | ${baseTitle}`;
         }
      });
   }, [location]);
   return null;
};

export default BasicLayoutTitleUpdater;
