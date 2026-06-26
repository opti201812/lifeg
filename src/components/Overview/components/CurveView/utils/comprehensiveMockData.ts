import { ChartDataPoint } from "../../../../../shared";

/**
 * 简单的种子随机数生成器（基于 personnelId 生成确定性数据）
 * 使每个人员卡片的 mock 数据各不相同但保持稳定，避免每次渲染抖动。
 */
const seededRandom = (seed: number) => {
   let s = seed % 2147483647;
   if (s <= 0) s += 2147483646;
   return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
   };
};

/**
 * 生成综合评测 mock 曲线数据
 *
 * 包含四项指标（与 seriesDefaults.ts 的 comprehensiveEvaluation 分组一致）：
 * - stressEmotion 压力值（0-100，70/90 限值）
 * - fatigueTolerance 疲劳耐受值（0-100，70/90 限值）
 * - sleepQuality 睡眠质量分数（0-100，70/90 限值）
 * - heartAttackRisk 心梗风险值（30/50 限值）
 *
 * 真实数据尚未接入前，综合评测 tab 使用此 mock 数据绘制曲线，
 * 卡片底部的实时值同样取自最新一个 mock 点，以便演示"高风险/高压力/高疲劳/差睡眠质量"红字效果。
 *
 * @param personnelId 人员ID，用作种子
 * @param count 数据点数量（默认 24，即最近24小时每小时一个点）
 */
export const generateComprehensiveMockData = (personnelId: number, count: number = 24): ChartDataPoint[] => {
   const rand = seededRandom(Math.abs(personnelId) || 1);
   const data: ChartDataPoint[] = [];
   const now = Date.now();
   const stepMs = 60 * 60 * 1000; // 每小时一个点

   for (let i = 0; i < count; i++) {
      const timestamp = now - (count - 1 - i) * stepMs;
      data.push({
         timestamp,
         // 压力值：40-95，偶尔触发高压力(≥90)
         stressEmotion: Math.round(40 + rand() * 55),
         // 疲劳耐受值：45-100，偶尔触发高疲劳(≥90)
         fatigueTolerance: Math.round(45 + rand() * 55),
         // 睡眠质量分数：50-100，偶尔触发差睡眠(<70)
         sleepQuality: Math.round(50 + rand() * 50),
         // 心梗风险值：10-65，偶尔触发高风险(≥50)
         heartAttackRisk: Math.round(10 + rand() * 55),
      } as ChartDataPoint);
   }
   return data;
};
