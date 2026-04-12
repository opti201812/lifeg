import React, { useCallback, useRef } from "react";
import { UnifiedChart, ChartDataPoint, SeriesConfig } from "../../../../../shared";

interface OptimizedUnifiedChartProps {
   data: ChartDataPoint[];
   seriesConfigs: SeriesConfig[];
   height: number;
   personnelId: number;
}

/**
 * 优化的图表组件，支持增量更新和多系列显示
 */
const OptimizedUnifiedChart: React.FC<OptimizedUnifiedChartProps> = React.memo(
   (props) => {
      // 图表实例引用，用于增量更新
      const chartRefs = useRef<Map<number, { appendData: (data: ChartDataPoint[]) => void }>>(new Map());

      // 注册图表实例引用，用于增量更新
      const registerChartRef = useCallback(
         (chartInstance: { appendData: (data: ChartDataPoint[]) => void }) => {
            if (chartInstance) {
               // 确保 personnelId 是数字类型，与 chartRefs 的 key 类型一致
               const personnelId =
                  typeof props.personnelId === "string" ? parseInt(props.personnelId, 10) : props.personnelId;

               chartRefs.current.set(personnelId, chartInstance);
            }
         },
         [props.personnelId]
      );

      // 清理引用（只在组件卸载时清理）
      const isMountedRef = React.useRef(true);
      React.useEffect(() => {
         isMountedRef.current = true;
         return () => {
            isMountedRef.current = false;
            // 修复：只在组件真正卸载时清理
            chartRefs.current.delete(props.personnelId);
         };
      }, []); // 关键：只在组件卸载时执行

      return (
         <UnifiedChart
            mode='multi'
            data={props.data}
            seriesConfig={props.seriesConfigs[0]} // 向后兼容：保留 seriesConfig
            seriesConfigs={props.seriesConfigs} // 传递多个系列配置
            enableLazyLoading={false}
            chartCount={12}
            hideLegend={true}
            height={props.height}
            onChartReady={registerChartRef}
         />
      );
   },
   (prevProps, nextProps) => {
      // 自定义比较函数：只在关键数据变化时重新渲染
      const prevLatest = prevProps.data[prevProps.data.length - 1];
      const nextLatest = nextProps.data[nextProps.data.length - 1];

      // 详细记录比较结果
      const dataLengthChanged = prevProps.data.length !== nextProps.data.length;
      const timestampChanged = prevLatest?.timestamp !== nextLatest?.timestamp;
      const heartRateChanged = prevLatest?.heartRate !== nextLatest?.heartRate;
      const breathRateChanged = prevLatest?.breathRate !== nextLatest?.breathRate;
      const seriesConfigsChanged = JSON.stringify(prevProps.seriesConfigs) !== JSON.stringify(nextProps.seriesConfigs);
      const heightChanged = prevProps.height !== nextProps.height;
      const personnelIdChanged = prevProps.personnelId !== nextProps.personnelId;

      // 如果数据长度和最新数据点都没有变化，则不需要重渲染
      const isSame =
         !dataLengthChanged &&
         !timestampChanged &&
         !heartRateChanged &&
         !breathRateChanged &&
         !seriesConfigsChanged &&
         !heightChanged &&
         !personnelIdChanged;

      return isSame;
   }
);

export default OptimizedUnifiedChart;
