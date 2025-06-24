import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { REFRESH_INTERVAL } from "../utils/constants";

/**
 * 数据刷新管理hook
 */
export const useDataRefresh = (fetchData: () => Promise<void>) => {
   const [refreshCounter, setRefreshCounter] = useState(0);
   const location = useLocation();

   // 监听来自其他页面的刷新请求
   useEffect(() => {
      if (location.state?.refresh) {
         fetchData();
         // 清除状态，避免重复刷新
         window.history.replaceState({}, document.title);
      }
   }, [location.state, fetchData]);

   // 添加定时器，每5秒检查一次数据过期情况
   useEffect(() => {
      const interval = setInterval(() => {
         setRefreshCounter((prev) => prev + 1);
      }, REFRESH_INTERVAL);

      return () => clearInterval(interval); // 组件卸载时清除定时器
   }, []);

   // 手动刷新函数
   const manualRefresh = useCallback(() => {
      fetchData();
   }, [fetchData]);

   return {
      refreshCounter,
      manualRefresh,
   };
};
