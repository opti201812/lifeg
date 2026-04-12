import { useState, useCallback } from "react";
import { ChartDataPoint } from "../../../../../shared";
import { transformHistoryDataToChartPoints } from "../utils/dataTransformers";
import axios from "axios";
import dayjs from "dayjs";
import config from "../../../../../config";
import { message } from "antd";

/**
 * 历史数据加载和管理 Hook
 */
export const useHistoricalData = (personnelIds: number[]) => {
   // 历史数据状态
   const [historicalData, setHistoricalData] = useState<Map<number, ChartDataPoint[]>>(new Map());
   // 历史数据加载状态
   const [loadingHistory, setLoadingHistory] = useState<Set<number>>(new Set());

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

   return {
      historicalData,
      loadingHistory,
      loadHistoricalData,
   };
};
