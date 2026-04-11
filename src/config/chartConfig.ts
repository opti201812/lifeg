/**
 * 图表配置文件
 * 用于控制整个应用的图表显示模式
 */

import packageJson from "../../package.json";

type ChartMode = "single" | "multi";

const chartMode = (packageJson.publishControl?.chartMode as ChartMode) || "multi";
const singleChartCardFontSize = packageJson.publishControl?.singleChartCardFontSize || 11;

export const CHART_MODE: ChartMode = chartMode;
export const SINGLE_CHART_CARD_FONT_SIZE: number = singleChartCardFontSize;

// 总览页面卡片每行显示数量（仅在multi模式下生效）
export const OVERVIEW_CARDS_PER_ROW: number = parseInt(process.env.REACT_APP_OVERVIEW_CARDS_PER_ROW || "4", 10);

// 根据图表模式获取卡片的栅格配置
export const getCardGridSpan = (): number => {
   if (CHART_MODE === "single") {
      // single模式：一行一个卡片
      return 24;
   } else {
      // multi模式：根据配置的每行数量计算span
      return 24 / OVERVIEW_CARDS_PER_ROW;
   }
};

// 图表高度配置
export const CHART_HEIGHT = {
   single: 600, // 单图表模式下的图表高度
   multi: 180, // 多图表模式下的图表高度
};

// 获取当前模式的图表高度
export const getChartHeight = (): number => {
   return CHART_HEIGHT[CHART_MODE];
};

// 性能配置：根据模式返回不同的性能参数
export const getPerformanceConfig = () => {
   if (CHART_MODE === "single") {
      return {
         maxDataPoints: 36000,
         enableIncrementalUpdate: true,
         enableLazyUpdate: true,
         throttleMs: 100,
         batchSize: 1000,
      };
   } else {
      return {
         maxDataPoints: 3600,
         enableIncrementalUpdate: true,
         enableLazyUpdate: true,
         throttleMs: 200,
         batchSize: 500,
      };
   }
};

// 数据刷新间隔（毫秒）
export const DATA_REFRESH_INTERVAL = 15000; // 15秒

// 导出配置对象（使用getter确保动态计算）
export const chartConfig = {
   mode: CHART_MODE,
   cardsPerRow: OVERVIEW_CARDS_PER_ROW,
   get chartHeight() {
      return getChartHeight();
   },
   get cardGridSpan() {
      return getCardGridSpan();
   },
   get performance() {
      return getPerformanceConfig();
   },
   dataRefreshInterval: DATA_REFRESH_INTERVAL,
};

export default chartConfig;
