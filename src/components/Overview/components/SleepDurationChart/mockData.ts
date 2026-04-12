import { ChartDataPoint } from "../../../../shared";

/**
 * 生成模拟睡眠数据
 * @param days 天数（默认7天）
 * @param seedHour 种子小时数，用于生成确定性的数据
 * @returns 模拟睡眠数据数组
 */
export const generateMockSleepData = (days: number = 7, seedHour?: number): ChartDataPoint[] => {
   const data: ChartDataPoint[] = [];
   const now = new Date();

   for (let d = 0; d < days; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (days - d));

      // 每天生成多个时间点（每3小时一个）
      for (let h = 0; h < 24; h += 3) {
         const time = new Date(date);
         time.setHours(h, 0, 0, 0);

         // 使用 seed 生成确定性随机数
         let deepSleep = 0;
         let lightSleep = 0;
         let awake = 0;

         const hour = seedHour !== undefined ? seedHour : h;

         if (hour >= 0 && hour <= 6) {
            // 早上（0-6点）：深睡较多
            deepSleep = Math.random() * 60 + 40; // 40-100分钟
            lightSleep = Math.random() * 30 + 20; // 20-50分钟
            awake = Math.random() * 10 + 5; // 5-15分钟
         } else if (hour >= 9 && hour <= 15) {
            // 白天（9-15点）：清醒为主
            deepSleep = Math.random() * 5;
            lightSleep = Math.random() * 10 + 5;
            awake = Math.random() * 30 + 20;
         } else if (hour >= 18 && hour <= 23) {
            // 晚上（18-23点）：浅睡和清醒交替
            deepSleep = Math.random() * 20 + 10;
            lightSleep = Math.random() * 40 + 30;
            awake = Math.random() * 15 + 10;
         } else {
            // 其他时间：清醒
            deepSleep = Math.random() * 5;
            lightSleep = Math.random() * 10;
            awake = Math.random() * 20 + 10;
         }

         // 计算连续深睡时长（约为深睡时长的70%）
         const continuousDeepSleep = deepSleep > 0 ? deepSleep * 0.7 + Math.random() * 10 : 0;

         data.push({
            timestamp: time.getTime(),
            deepSleepDuration: deepSleep,
            lightSleepDuration: lightSleep,
            awakeDuration: awake,
            totalSleepDuration: deepSleep + lightSleep,
            maxContinuousDeepSleep: continuousDeepSleep,
         } as ChartDataPoint);
      }
   }

   return data;
};

/**
 * 生成睡眠质量差的模拟数据
 * @param count 数据点数量
 * @returns 模拟睡眠数据数组
 */
export const generatePoorSleepData = (count: number = 5): ChartDataPoint[] => {
   const data: ChartDataPoint[] = [];
   const now = new Date();

   for (let i = 0; i < count; i++) {
      const time = new Date(now);
      time.setHours(time.getHours() - (count - i) * 3);

      data.push({
         timestamp: time.getTime(),
         deepSleepDuration: Math.random() * 30 + 10, // 10-40分钟
         lightSleepDuration: Math.random() * 30 + 20, // 20-50分钟
         awakeDuration: Math.random() * 50 + 30, // 30-80分钟
         totalSleepDuration: Math.random() * 50 + 30, // 30-80分钟
         maxContinuousDeepSleep: Math.random() * 10 + 5, // 5-15分钟
      } as ChartDataPoint);
   }

   return data;
};

/**
 * 生成睡眠质量好的模拟数据
 * @param count 数据点数量
 * @returns 模拟睡眠数据数组
 */
export const generateGoodSleepData = (count: number = 5): ChartDataPoint[] => {
   const data: ChartDataPoint[] = [];
   const now = new Date();

   for (let i = 0; i < count; i++) {
      const time = new Date(now);
      time.setHours(time.getHours() - (count - i) * 3);

      data.push({
         timestamp: time.getTime(),
         deepSleepDuration: Math.random() * 30 + 80, // 80-110分钟
         lightSleepDuration: Math.random() * 20 + 35, // 35-55分钟
         awakeDuration: Math.random() * 10 + 3, // 3-13分钟
         totalSleepDuration: Math.random() * 30 + 115, // 115-145分钟
         maxContinuousDeepSleep: Math.random() * 20 + 60, // 60-80分钟
      } as ChartDataPoint);
   }

   return data;
};

/**
 * 生成缺少数据的场景
 * @returns 模拟睡眠数据数组（全为0）
 */
export const generateNoDataScenario = (): ChartDataPoint[] => {
   return [
      {
         timestamp: Date.now(),
         deepSleepDuration: 0,
         lightSleepDuration: 0,
         awakeDuration: 0,
         totalSleepDuration: 0,
      } as ChartDataPoint,
   ];
};

/**
 * 生成只有部分数据的场景
 * @returns 模拟睡眠数据数组
 */
export const generatePartialDataScenario = (): ChartDataPoint[] => {
   return [
      {
         timestamp: Date.now() - 4 * 60 * 60 * 1000,
         deepSleepDuration: 60,
         lightSleepDuration: 40,
         awakeDuration: 10,
         totalSleepDuration: 100,
         maxContinuousDeepSleep: 45,
      } as ChartDataPoint,
      {
         timestamp: Date.now() - 2 * 60 * 60 * 1000,
         deepSleepDuration: 50,
         lightSleepDuration: 50,
         awakeDuration: 15,
         totalSleepDuration: 100,
         maxContinuousDeepSleep: 40,
      } as ChartDataPoint,
      {
         timestamp: Date.now(),
         deepSleepDuration: 55,
         lightSleepDuration: 45,
         awakeDuration: 12,
         totalSleepDuration: 100,
         maxContinuousDeepSleep: 42,
      } as ChartDataPoint,
   ];
};

/**
 * 生成长期睡眠追踪数据
 * @param days 天数
 * @returns 模拟睡眠数据数组
 */
export const generateLongTermSleepData = (days: number = 30): ChartDataPoint[] => {
   const data: ChartDataPoint[] = [];
   const now = new Date();

   for (let d = 0; d < days; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (days - d));
      date.setHours(22, 0, 0, 0); // 每天晚上10点记录一次睡眠数据

      // 整体睡眠质量呈上升趋势
      const qualityFactor = d / days; // 0到1的递进
      const baseDeepSleep = 60 + qualityFactor * 30; // 60-90分钟
      const baseLightSleep = 40 + qualityFactor * 15; // 40-55分钟
      const baseAwake = 20 - qualityFactor * 10; // 20-10分钟

      data.push({
         timestamp: date.getTime(),
         deepSleepDuration: Math.max(0, baseDeepSleep + (Math.random() - 0.5) * 20),
         lightSleepDuration: Math.max(0, baseLightSleep + (Math.random() - 0.5) * 15),
         awakeDuration: Math.max(0, baseAwake + (Math.random() - 0.5) * 10),
         totalSleepDuration: Math.max(0, baseDeepSleep + baseLightSleep + (Math.random() - 0.5) * 20),
         maxContinuousDeepSleep: Math.max(0, baseDeepSleep * 0.7 + (Math.random() - 0.5) * 15),
      } as ChartDataPoint);
   }

   return data;
};
