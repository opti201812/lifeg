import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { REFRESH_INTERVAL } from "../utils/constants";

export const useDataRefresh = (fetchData: () => Promise<void>) => {
   const [refreshCounter, setRefreshCounter] = useState(0);
   const location = useLocation();

   useEffect(() => {
      if ((location as any).state?.refresh) {
         fetchData();
         window.history.replaceState({}, document.title);
      }
   }, [(location as any).state, fetchData]);

   useEffect(() => {
      const interval = setInterval(() => {
         setRefreshCounter((prev) => prev + 1);
      }, REFRESH_INTERVAL);
      return () => clearInterval(interval);
   }, []);

   const manualRefresh = useCallback(() => {
      fetchData();
   }, [fetchData]);

   return {
      refreshCounter,
      manualRefresh,
   };
};
