import React from "react";
import {
   HeartOutlined,
   CloudOutlined,
   ArrowUpOutlined,
   ArrowDownOutlined,
   DashboardOutlined,
   LineChartOutlined,
   ThunderboltOutlined,
} from "@ant-design/icons";
import { SeriesConfig } from "../../../../../shared";

/**
 * 根据系列配置的 key 获取对应的图标组件
 */
export const getIconForSeriesKey = (key: string): React.ReactNode => {
   const iconMap: Record<string, React.ReactNode> = {
      heartRate: <HeartOutlined />,
      breathRate: <CloudOutlined />,
      distance: <DashboardOutlined />,
      sdnn: <LineChartOutlined />,
      rmssd: <LineChartOutlined />,
      pnn50: <LineChartOutlined />,
      lfPower: <ThunderboltOutlined />,
      hfPower: <ThunderboltOutlined />,
      lfHfRatio: <ThunderboltOutlined />,
      sleepQuality: <CloudOutlined />,
      stressEmotion: <ThunderboltOutlined />,
      fatigueTolerance: <ThunderboltOutlined />,
   };
   return iconMap[key] || <LineChartOutlined />;
};

/**
 * 根据数值和配置获取趋势图标
 */
export const getTrendIcon = (value: number | null, config: SeriesConfig): React.ReactNode => {
   // 根据 markLines 判断趋势
   if (value !== null && config.markLines && config.markLines.length > 0) {
      const markLineValues = config.markLines.map((ml) => ml.value).sort((a, b) => a - b);
      const maxLimit = markLineValues[markLineValues.length - 1];
      const minLimit = markLineValues[0];

      // 如果超过最高限值，显示上升趋势（异常高）
      if (value > maxLimit) {
         return <ArrowUpOutlined style={{ color: "#f5222d" }} />;
      }
      // 如果低于最低限值，显示下降趋势（异常低）
      else if (value < minLimit) {
         return <ArrowDownOutlined style={{ color: "#fa8c16" }} />;
      }
   }

   return null;
};

/**
 * 格式化数值显示
 */
export const formatValue = (value: number | null): string => {
   if (value === null) return "-";
   return value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
};

/**
 * 判断综合评测某项指标是否处于异常（需红字高亮）状态
 *
 * 依据 seriesDefaults.ts 中各指标的限值线：
 * - 压力值 stressEmotion：≥90 高压力
 * - 疲劳耐受值 fatigueTolerance：≥90 高疲劳
 * - 睡眠质量分数 sleepQuality：<70 差睡眠质量
 * - 心梗风险值 heartAttackRisk：≥50 高风险
 */
export const isComprehensiveValueAbnormal = (key: string, value: number | null): boolean => {
   if (value === null) return false;
   switch (key) {
      case "stressEmotion":
         return value >= 90;
      case "fatigueTolerance":
         return value >= 90;
      case "sleepQuality":
         return value < 70;
      case "heartAttackRisk":
         return value >= 50;
      default:
         return false;
   }
};
