import React, { useMemo } from "react";
import { Col, Card, Spin } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { RoomPersonnel } from "../../../types";
import SleepDurationChart from "../../SleepDurationChart";
import OptimizedUnifiedChart from "./OptimizedUnifiedChart";
import { ChartDataPoint, SeriesConfig } from "../../../../../shared";
import { getValueForSeries } from "../utils/dataTransformers";
import { getIconForSeriesKey, getTrendIcon, formatValue, isComprehensiveValueAbnormal } from "../utils/chartHelpers";
import { generateComprehensiveMockData } from "../utils/comprehensiveMockData";
import chartConfig from "../../../../../config/chartConfig";

interface PersonnelChartCardProps {
   roomPersonnel: RoomPersonnel & { deviceInfo?: any; braceletStatus?: string };
   chartData: ChartDataPoint[];
   isLoadingHistory: boolean;
   activeSubTab: string;
   activeSeriesConfigs: SeriesConfig[];
   currentGroupSeries: SeriesConfig[];
   seriesConfigs: SeriesConfig[];
   showPersonnelName: boolean;
   onCardClick: (roomPersonnel: RoomPersonnel) => void;
}

/**
 * 单个人员卡片组件（包含图表）
 */
const PersonnelChartCard: React.FC<PersonnelChartCardProps> = ({
   roomPersonnel,
   chartData,
   isLoadingHistory,
   activeSubTab,
   activeSeriesConfigs,
   currentGroupSeries,
   seriesConfigs,
   showPersonnelName,
   onCardClick,
}) => {
   if (!roomPersonnel.personnel) return null;

   // 确保 personnelId 是数字类型
   const personnelId =
      typeof roomPersonnel.personnel.id === "string"
         ? parseInt(roomPersonnel.personnel.id, 10)
         : roomPersonnel.personnel.id;

   // 综合评测：真实数据尚未接入，使用 mock 数据绘制曲线（各卡片按 personnelId 生成稳定数据）
   const comprehensiveMockData = useMemo(
      () => generateComprehensiveMockData(personnelId),
      [personnelId]
   );

   return (
      <Col span={chartConfig.cardGridSpan} key={`personnel-${roomPersonnel.associationId}`}>
         <Card
            hoverable
            onClick={() => onCardClick(roomPersonnel)}
            className='personnel-card-with-chart'
            style={{ minHeight: "300px" }}
            styles={{ body: { padding: "12px" } }}
         >
            {/* 上部：人员信息（房间名、姓名、状态图标） */}
            <div className='personnel-info-header' style={{ marginBottom: "12px" }}>
               <div style={{ fontSize: "14px", fontWeight: 500 }}>
                  {roomPersonnel.room.name}
                  {showPersonnelName && roomPersonnel.personnel && (
                     <span style={{ marginLeft: "8px", color: "#666" }}>{roomPersonnel.personnel.name}</span>
                  )}
               </div>
               {/* TODO: 添加状态图标（网络、雷达、手环等） */}
            </div>

            {/* 中部：嵌入式曲线图（根据标签页选择不同的图表组件） */}
            <div style={{ height: `${chartConfig.chartHeight}px`, marginBottom: "8px" }}>
               {isLoadingHistory ? (
                  <div
                     style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        color: "#999",
                     }}
                  >
                     <Spin size='small' style={{ marginRight: 8 }} />
                     加载历史数据...
                  </div>
               ) : activeSubTab === "sleep" ? (
                  // 睡眠分析：使用睡眠时长图表
                  <SleepDurationChart
                     key={`sleep-chart-${personnelId}`}
                     data={chartData}
                     height={chartConfig.chartHeight}
                  />
               ) : activeSubTab === "comprehensive" ? (
                  // 综合评测：合并曲线（压力/疲劳耐受/睡眠质量/心梗风险），使用与基础体征相同的基础图表组件
                  <OptimizedUnifiedChart
                     key={`comp-chart-${personnelId}-${activeSeriesConfigs.map((c) => c.key).join("-")}`}
                     data={comprehensiveMockData}
                     seriesConfigs={activeSeriesConfigs}
                     height={chartConfig.chartHeight}
                     personnelId={personnelId}
                  />
               ) : activeSeriesConfigs.length > 0 ? (
                  // 其他标签页：使用折线图
                  <OptimizedUnifiedChart
                     key={`chart-${personnelId}-${activeSeriesConfigs.map((c) => c.key).join("-")}`}
                     data={chartData}
                     seriesConfigs={activeSeriesConfigs}
                     height={chartConfig.chartHeight}
                     personnelId={personnelId}
                  />
               ) : (
                  <div
                     style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        color: "#999",
                     }}
                  >
                     配置加载中...
                  </div>
               )}
            </div>

            {/* 下部：最后实测值显示区域 */}
            <div className='realtime-values' style={{ fontSize: "12px", color: "#666" }}>
               <div style={{ display: "grid", gridTemplateColumns: "repeat(8, minmax(0, 1fr))", gap: "8px" }}>
                  {/* 综合评测下只显示状态类数据（压力、疲劳、心梗风险、睡眠质量），不显示时长数据 */}
                  {activeSubTab === "comprehensive"
                     ? // 综合评测：显示四项评测指标，取自 mock 最新点；高风险/高压力/高疲劳/差睡眠质量时红字高亮
                       ["stressEmotion", "fatigueTolerance", "heartAttackRisk", "sleepQuality"].map((key) => {
                          const cfg = seriesConfigs.find((c) => c.key === key);
                          if (!cfg) return null;
                          // 真实数据尚未接入，取 mock 曲线最新一个点的值
                          const latestPoint = comprehensiveMockData[comprehensiveMockData.length - 1];
                          const value =
                             latestPoint != null
                                ? (latestPoint as ChartDataPoint)[key as keyof ChartDataPoint] as unknown as number | null
                                : null;
                          const numericValue =
                             value === null || value === undefined || Number.isNaN(Number(value)) ? null : Number(value);
                          const icon = getIconForSeriesKey(cfg.key);
                          const trendIcon = getTrendIcon(numericValue, cfg);
                          const abnormal = isComprehensiveValueAbnormal(cfg.key, numericValue);

                          return (
                             <span
                                key={cfg.key}
                                style={{
                                   display: "inline-flex",
                                   alignItems: "center",
                                   gap: 3,
                                   minWidth: 0,
                                   overflow: "hidden",
                                   whiteSpace: "nowrap",
                                }}
                                title={cfg.name}
                             >
                                <span style={{ color: cfg.color, flexShrink: 0 }}>{icon}</span>
                                <span
                                   style={{
                                      flexShrink: 0,
                                      color: abnormal ? "#f5222d" : undefined,
                                      fontWeight: abnormal ? 600 : undefined,
                                   }}
                                >
                                   {formatValue(numericValue)}
                                </span>
                                {trendIcon && <span style={{ flexShrink: 0 }}>{trendIcon}</span>}
                             </span>
                          );
                       })
                     : // 其他标签页：按原逻辑显示
                       currentGroupSeries.map((cfg) => {
                          // 从 Redux 获取最新数据，而不是从历史数据
                          const value = getValueForSeries(personnelId, cfg, roomPersonnel.deviceInfo);
                          const icon = getIconForSeriesKey(cfg.key);
                          const trendIcon = getTrendIcon(value, cfg);

                          return (
                             <span
                                key={cfg.key}
                                style={{
                                   display: "inline-flex",
                                   alignItems: "center",
                                   gap: 3,
                                   minWidth: 0,
                                   overflow: "hidden",
                                   whiteSpace: "nowrap",
                                }}
                                title={cfg.name}
                             >
                                <span style={{ color: cfg.color, flexShrink: 0 }}>{icon}</span>
                                <span style={{ flexShrink: 0 }}>{formatValue(value)}</span>
                                {trendIcon && <span style={{ flexShrink: 0 }}>{trendIcon}</span>}
                             </span>
                          );
                       })}
               </div>
            </div>
         </Card>
      </Col>
   );
};

export default PersonnelChartCard;
