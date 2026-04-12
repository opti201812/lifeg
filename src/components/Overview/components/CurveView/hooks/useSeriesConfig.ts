import { useMemo, useState } from "react";
import { chartConfigManager } from "../../../../../shared/src/utils/chartConfigManager";
import { SeriesConfig } from "../../../../../shared";

/**
 * 系列配置管理 Hook
 */
export const useSeriesConfig = (activeSubTab: string) => {
   // 使用动态系列配置，来源于共享配置管理器
   const allSeriesConfigs = useMemo(() => chartConfigManager.getSeriesConfig(), []);

   // 初始化图例可见性：默认全部选中
   const [legendVisible, setLegendVisible] = useState<Record<string, boolean>>(() => {
      const map: Record<string, boolean> = {};
      allSeriesConfigs.forEach((c) => {
         map[c.name] = true; // 默认全部选中
      });
      return map;
   });

   // 当前分组的系列（用于渲染小卡片上的图例）
   const groupKeyByTab: Record<string, string> = {
      basic: "basicVitals",
      analysis: "vitalAnalysis",
      comprehensive: "sleepMonitoring", // 根据 seriesDefaults.ts，综合评测对应 sleepMonitoring
   };
   const currentGroupKey = groupKeyByTab[activeSubTab];

   // 缓存分组系列配置，避免重复过滤
   const currentGroupSeries = useMemo(() => {
      return allSeriesConfigs.filter((cfg) => cfg.group === currentGroupKey);
   }, [allSeriesConfigs, currentGroupKey]);

   // 根据当前图例状态过滤显示的系列（支持多选，只包含当前分组的系列）
   const activeSeriesConfigs = useMemo(() => {
      const visible = currentGroupSeries.filter((config) => legendVisible[config.name]);
      // 如果没有任何选中的，至少返回第一个
      return visible.length > 0 ? visible : [currentGroupSeries[0]];
   }, [currentGroupSeries, legendVisible]);

   // 处理图例切换：支持多选
   const handleLegendToggle = (seriesName: string) => {
      setLegendVisible((prev) => {
         const next: Record<string, boolean> = { ...prev };
         // 切换当前系列的选中状态
         next[seriesName] = !prev[seriesName];
         return next;
      });
   };

   return {
      allSeriesConfigs,
      seriesConfigs: allSeriesConfigs, // 为了向后兼容，提供 seriesConfigs 别名
      legendVisible,
      currentGroupKey,
      currentGroupSeries,
      activeSeriesConfigs,
      handleLegendToggle,
   };
};
