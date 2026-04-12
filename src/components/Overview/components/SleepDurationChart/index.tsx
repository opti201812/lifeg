/**
 * 睡眠时长图表组件
 *
 * 用于在"人员总览"的"曲线"/"综合评测"标签页卡片中展示睡眠数据。
 * 采用横向柱状图展示各睡眠状态的总时长。
 *
 * 特点：
 * - 横向柱状图：横坐标为时长（分钟），纵坐标为睡眠状态类型
 * - 颜色配置：使用配置文件中的颜色，与上方图例一致
 * - 无图例：图表下方不显示图例
 * - 交互式Tooltip：鼠标悬停显示详细数据
 */

import React, { useMemo } from "react";
import { Empty } from "antd";
import ReactECharts from "echarts-for-react";
import { EChartsOption } from "echarts";
import { ChartDataPoint } from "../../../../shared";
import { generateGoodSleepData } from "./mockData";
import { defaultSeriesConfigs } from "../../../../shared/src/utils/seriesDefaults";

interface SleepDurationChartProps {
   data: ChartDataPoint[];
   height?: number;
   useMockDataWhenEmpty?: boolean; // 当数据为空时是否使用模拟数据
}

const SleepDurationChart: React.FC<SleepDurationChartProps> = ({ data, height = 200, useMockDataWhenEmpty = true }) => {
   // 如果数据为空或无有效值，且允许使用模拟数据，则使用睡眠质量好的模拟数据
   const effectiveData = useMemo(() => {
      const hasValidOriginalData = Array.isArray(data)
         ? data.some((item) => {
              const deep = Number((item as any)?.deepSleepDuration ?? 0);
              const light = Number((item as any)?.lightSleepDuration ?? 0);
              const awake = Number((item as any)?.awakeDuration ?? 0);
              const total = Number((item as any)?.totalSleepDuration ?? 0);
              return deep > 0 || light > 0 || awake > 0 || total > 0;
           })
         : false;

      if (useMockDataWhenEmpty && (!Array.isArray(data) || data.length === 0 || !hasValidOriginalData)) {
         return generateGoodSleepData(8); // 生成8个数据点的优质睡眠数据
      }
      return Array.isArray(data) ? data : [];
   }, [data, useMockDataWhenEmpty]);

   // 从配置文件中获取颜色
   const getColorFromConfig = (key: string): string => {
      const config = defaultSeriesConfigs.find((cfg) => cfg.key === key);
      return config?.color || "#666";
   };

   // 提取睡眠时长数据并构建ECharts配置（横向柱状图）
   const chartOption = useMemo<EChartsOption>(() => {
      if (!effectiveData || effectiveData.length === 0) {
         return {};
      }

      // 累加所有数据点的总时长（连续深睡时长取最大值）
      const totalDurations = effectiveData.reduce(
         (acc, item) => {
            acc.awake += parseFloat((item as any).awakeDuration as any) || 0;
            acc.lightSleep += parseFloat((item as any).lightSleepDuration as any) || 0;
            acc.deepSleep += parseFloat((item as any).deepSleepDuration as any) || 0;
            const continuousDeepSleep = parseFloat((item as any).maxContinuousDeepSleep as any) || 0;
            acc.continuousDeepSleep = Math.max(acc.continuousDeepSleep, continuousDeepSleep);
            return acc;
         },
         {
            awake: 0,
            lightSleep: 0,
            deepSleep: 0,
            continuousDeepSleep: 0,
         }
      );

      // 检查是否有有效数据
      const hasValidData =
         totalDurations.awake > 0 ||
         totalDurations.lightSleep > 0 ||
         totalDurations.deepSleep > 0 ||
         totalDurations.continuousDeepSleep > 0;

      if (!hasValidData) {
         return {};
      }

      // 准备柱状图数据
      const categories = ["清醒总时长", "浅睡总时长", "深睡总时长", "连续深睡时长"];
      const values = [
         totalDurations.awake,
         totalDurations.lightSleep,
         totalDurations.deepSleep,
         totalDurations.continuousDeepSleep,
      ];
      const colors = [
         getColorFromConfig("awakeDuration"), // #ff4d4f
         getColorFromConfig("lightSleepDuration"), // #1890ff
         getColorFromConfig("deepSleepDuration"), // #52c41a
         getColorFromConfig("maxContinuousDeepSleep"), // #13c2c2
      ];

      return {
         tooltip: {
            trigger: "axis",
            axisPointer: {
               type: "shadow",
            },
            formatter: (params: any) => {
               if (!params || params.length === 0) return "";
               const param = params[0];
               if (!param) return "";

               return `<div style="font-size: 12px;">
                  <div style="font-weight: bold; margin-bottom: 4px;">${param.name}</div>
                  <div style="color: ${param.color};">时长: ${param.value.toFixed(0)} 分钟</div>
               </div>`;
            },
         },
         grid: {
            left: "25%",
            right: "10%",
            top: "10%",
            bottom: "10%",
            containLabel: false,
         },
         xAxis: {
            type: "value",
            name: "时长(分钟)",
            nameLocation: "middle",
            nameGap: 30,
            axisLabel: {
               fontSize: 10,
               color: "#666",
            },
            nameTextStyle: {
               fontSize: 10,
               color: "#666",
            },
         },
         yAxis: {
            type: "category",
            data: categories,
            axisLabel: {
               fontSize: 11,
               color: "#666",
            },
         },
         series: [
            {
               type: "bar",
               data: values.map((value, index) => ({
                  value: value,
                  itemStyle: {
                     color: colors[index],
                  },
               })),
               label: {
                  show: true,
                  position: "right",
                  formatter: (params: any) => {
                     return `${params.value.toFixed(0)} 分钟`;
                  },
                  fontSize: 10,
                  color: "#666",
               },
            },
         ],
      };
   }, [effectiveData]);

   // 如果没有有效数据，显示空状态
   const series = chartOption.series as any;
   if (!series || (Array.isArray(series) && series.length === 0)) {
      return (
         <div
            style={{
               display: "flex",
               alignItems: "center",
               justifyContent: "center",
               height: `${height}px`,
            }}
         >
            <Empty description='暂无睡眠数据' style={{ margin: 0 }} />
         </div>
      );
   }

   return (
      <ReactECharts
         option={chartOption}
         style={{ height: `${height}px`, width: "100%" }}
         opts={{
            renderer: "canvas",
            devicePixelRatio: window.devicePixelRatio || 1,
         }}
         notMerge={true}
         lazyUpdate={false}
      />
   );
};

export default SleepDurationChart;
