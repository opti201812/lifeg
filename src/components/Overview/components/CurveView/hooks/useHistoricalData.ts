import { useState, useCallback, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { ChartDataPoint } from "../../../../../shared";
import {
   transformHistoryDataToChartPoints,
   transformRealtimeDataToChartPoint,
} from "../utils/dataTransformers";
import axios from "axios";
import dayjs from "dayjs";
import config from "../../../../../config";
import { message } from "antd";
import { RootState } from "../../../../../store";
import { REFRESH_INTERVAL } from "../utils/constants";

/**
 * 历史数据加载和管理 Hook
 * 同时支持每 REFRESH_INTERVAL 从 Redux personDeviceData 追加实时数据点
 */
export const useHistoricalData = (personnelIds: number[]) => {
   // 历史数据状态
   const [historicalData, setHistoricalData] = useState<Map<number, ChartDataPoint[]>>(new Map());
   // 历史数据加载状态
   const [loadingHistory, setLoadingHistory] = useState<Set<number>>(new Set());

   // 实时设备数据：用 ref 保存最新快照，避免 WebSocket 高频更新导致定时器重建
   const personDeviceData = useSelector((state: RootState) => state.data.personDeviceData);
   const personDeviceDataRef = useRef(personDeviceData);
   personDeviceDataRef.current = personDeviceData;

   // 上一次已处理的数据快照，避免重复转换未变化人员
   const lastSnapshotRef = useRef<Map<number, any>>(new Map());

   /**
    * 加载人员历史数据（过去1小时）
    */
   const loadHistoricalData = useCallback(
      async (personnelId: number) => {
         // 如果已经在加载中，跳过
         if (loadingHistory.has(personnelId)) {
            return;
         }

         // 如果已经加载过，跳过
         if (historicalData.has(personnelId)) {
            return;
         }

         try {
            setLoadingHistory((prev) => new Set(prev).add(personnelId));

            // 获取过去1小时的数据
            const oneHourAgo = dayjs().subtract(1, "hour").format("YYYY-MM-DD HH:mm:ss");
            const now = dayjs().format("YYYY-MM-DD HH:mm:ss");

            const queryParams = new URLSearchParams({
               personnelId: personnelId.toString(),
               startDate: oneHourAgo,
               endDate: now,
            });

            const response = await axios.get(`${config.backend.url}/history?${queryParams.toString()}`, {
               headers: {
                  "Cache-Control": "no-cache",
               },
            });

            // 转换为 ChartDataPoint 格式
            const chartData: ChartDataPoint[] = transformHistoryDataToChartPoints(response.data);

            // 保存历史数据
            setHistoricalData((prev) => {
               const next = new Map(prev);
               next.set(personnelId, chartData);
               return next;
            });
         } catch (error) {
            console.error(`[CurveView] ❌ 加载历史数据失败: personnelId=${personnelId}`, error);
            message.error(`加载人员 ${personnelId} 的历史数据失败`);
         } finally {
            setLoadingHistory((prev) => {
               const next = new Set(prev);
               next.delete(personnelId);
               return next;
            });
         }
      },
      [loadingHistory, historicalData]
   );

   /**
    * 定时追加实时数据点
    */
   useEffect(() => {
      if (personnelIds.length === 0) {
         return;
      }

      const interval = setInterval(() => {
         const currentData = personDeviceDataRef.current;
         const updates = new Map<number, ChartDataPoint>();
         const now = Date.now();

         personnelIds.forEach((personnelId) => {
            const latest = currentData[personnelId];
            const lastSnapshot = lastSnapshotRef.current.get(personnelId);
            if (!latest || latest === lastSnapshot) {
               return;
            }

            const point = transformRealtimeDataToChartPoint(currentData, personnelId, now);
            if (point) {
               updates.set(personnelId, point);
               lastSnapshotRef.current.set(personnelId, latest);
            }
         });

         if (updates.size === 0) {
            return;
         }

         setHistoricalData((prev) => {
            const next = new Map(prev);
            updates.forEach((point, personnelId) => {
               const existing = next.get(personnelId) || [];
               // 维持约 1 小时滚动窗口
               const maxPoints = Math.ceil(3600000 / REFRESH_INTERVAL);
               const merged = existing.length >= maxPoints
                  ? [...existing.slice(1), point]
                  : [...existing, point];
               next.set(personnelId, merged);
            });
            return next;
         });
      }, REFRESH_INTERVAL);

      return () => clearInterval(interval);
   }, [personnelIds]);

   return {
      historicalData,
      loadingHistory,
      loadHistoricalData,
   };
};
