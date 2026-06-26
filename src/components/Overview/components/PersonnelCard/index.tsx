import React, { useState, useMemo } from "react";
import { Card, Row, Col, Tag, Dropdown, Menu } from "antd";
import {
   HeartOutlined,
   BellOutlined,
   CloudOutlined,
   DashboardOutlined,
   ThunderboltOutlined,
   LineChartOutlined,
   ArrowUpOutlined,
   ArrowDownOutlined,
   MoreOutlined,
} from "@ant-design/icons";
import { RoomPersonnel } from "../../types";
import { getTagInfo, getIcon } from "../../utils/roomHelpers";
import { chartConfigManager } from "../../../../shared/src/utils/chartConfigManager";
import chartConfig, { SINGLE_CHART_CARD_FONT_SIZE } from "../../../../config/chartConfig";

interface PersonnelCardProps {
   roomPersonnel: RoomPersonnel & {
      deviceInfo?: any;
      braceletStatus?: string;
   };
   showPersonnelName: boolean;
   alarms: any[];
   onCardClick: () => void;
   onDayCurveClick: (event: React.MouseEvent) => void;
   onWeekCurveClick: (event: React.MouseEvent) => void;
}

const PersonnelCard: React.FC<PersonnelCardProps> = ({
   roomPersonnel,
   showPersonnelName,
   alarms,
   onCardClick,
   onDayCurveClick,
   onWeekCurveClick,
}) => {
   const { room, personnel, deviceInfo } = roomPersonnel;

   if (!personnel) {
      return null;
   }

   if (!deviceInfo) {
      console.warn(`[PersonnelCard] 没有设备信息: personnelId=${personnel.id}`);
      return (
         <Col span={chartConfig.cardGridSpan} key={`${room.id}-${personnel.id}`}>
            <Card variant='borderless' onClick={onCardClick}>
               <div style={{ textAlign: "center", padding: "20px" }}>
                  <div>{room.name}</div>
                  <div style={{ fontSize: "12px", color: "#888" }}>{showPersonnelName ? personnel.name : ""}</div>
                  <div style={{ color: "#999", fontSize: "12px" }}>暂无设备数据</div>
               </div>
            </Card>
         </Col>
      );
   }

   const {
      heartRate,
      breathRate,
      distance,
      roomAndRadarData,
      // 🔥 信噪比：取环境干扰值 environmentInterference
      environmentInterference,
      braceletHeartRate,
      systolicPressure,
      diastolicPressure,
      spo2,
      bodyTemperature,
      oximeterHeartRate,
      pnn50,
      lfHfRatio,
      stressEmotion,
      fatigueTolerance,
      heartAttackRisk,
      sleepQuality,
   } = deviceInfo;

   // 🔥 控制指夹仪心率显示（可屏蔽）
   const [showOximeterHeartRate, setShowOximeterHeartRate] = useState(false);

   // 对待分配房间进行特殊处理
   const isUnassigned = room.id === -1;
   const roomName = isUnassigned ? "待分配房间" : room.name;

   // 🔥 格式化数值显示
   const formatValue = (value: any, unit: string = "") => {
      if (value === "-" || value === null || value === undefined) return "-";
      if (typeof value === "number") {
         return value % 1 === 0 ? `${value}${unit}` : `${value.toFixed(1)}${unit}`;
      }
      return `${value}${unit}`;
   };

   // 🔥 从配置管理器获取系列配置，用于动态读取阈值
   const seriesConfigs = useMemo(() => chartConfigManager.getSeriesConfig(), []);

   // 🔥 根据阈值判断趋势箭头（从seriesDefaults动态读取）
   const getTrendIcon = (key: string, value: any): React.ReactNode => {
      if (value === "-" || value === null || value === undefined || typeof value !== "number") {
         return null;
      }

      // 从seriesConfigs中查找对应的配置
      const config = seriesConfigs.find((cfg) => cfg.key === key);
      if (!config || !config.markLines || config.markLines.length === 0) {
         // 没有配置或没有markLines，不显示箭头
         return null;
      }

      // 获取所有markLines的值并排序
      const markLineValues = config.markLines.map((ml) => ml.value).sort((a, b) => a - b);
      const maxLimit = markLineValues[markLineValues.length - 1];
      const minLimit = markLineValues[0];

      // 如果超过最高限值，显示上升趋势（异常高）
      if (value > maxLimit) {
         return <ArrowUpOutlined style={{ color: "#f5222d", fontSize: 12 }} />;
      }
      // 如果低于最低限值，显示下降趋势（异常低）
      if (value < minLimit) {
         return <ArrowDownOutlined style={{ color: "#fa8c16", fontSize: 12 }} />;
      }

      return null;
   };

   // 🔥 可复用的数据项组件
   const labelFontSize = chartConfig.mode === "single" ? SINGLE_CHART_CARD_FONT_SIZE : 11;

   interface DataItemProps {
      icon: React.ReactNode;
      label: string;
      value: any;
      dataKey: string; // 用于查找配置的key
      unit?: string;
      formatter?: (value: any) => string; // 自定义格式化函数
   }

   const DataItem: React.FC<DataItemProps> = ({ icon, label, value, dataKey, unit = "", formatter }) => {
      const displayValue = formatter ? formatter(value) : formatValue(value, unit);
      const trendIcon = getTrendIcon(dataKey, value);

      return (
         <Col span={6}>
            <div style={{ textAlign: "center" }}>
               {icon}
               <p style={{ fontSize: labelFontSize, margin: "4px 0 0 0" }}>{label}</p>
               <p
                  style={{
                     fontSize: labelFontSize,
                     fontWeight: "bold",
                     margin: 0,
                     display: "inline-flex",
                     alignItems: "center",
                     gap: 4,
                  }}
               >
                  {displayValue}
                  {trendIcon}
               </p>
            </div>
         </Col>
      );
   };

   return (
      <Col span={chartConfig.cardGridSpan} key={`${room.id}-${personnel.id}`}>
         <Card
            variant='borderless'
            onClick={onCardClick}
            className={alarms.find((item) => item.personnelId == personnel.id) ? "alarm-card" : ""}
         >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <div>
                  <h3 style={isUnassigned ? { color: "#999" } : {}}>{roomName}</h3>
                  <div style={{ fontSize: "12px", color: "#888" }}>{showPersonnelName ? personnel.name : ""}</div>
               </div>
               <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Tag color={getTagInfo(room).color} key={`tag-${room.id}-${personnel.id}`}>
                     {getTagInfo(room).text}
                  </Tag>
                  {alarms.find((item) => item.roomId === room.id) && (
                     <BellOutlined style={{ color: "red", fontSize: 24 }} />
                  )}
                  <Dropdown
                     menu={{
                        items: [
                           {
                              key: "dayCurve",
                              label: "日曲线",
                           },
                           {
                              key: "weekCurve",
                              label: "周曲线",
                           },
                        ],
                        onClick: ({ key, domEvent }) => {
                           domEvent.stopPropagation();
                           if (key === "dayCurve") {
                              onDayCurveClick(domEvent as any);
                           } else if (key === "weekCurve") {
                              onWeekCurveClick(domEvent as any);
                           }
                        },
                     }}
                     trigger={["hover"]}
                     placement='bottomRight'
                  >
                     <MoreOutlined
                        style={{
                           fontSize: 18,
                           color: "#8c8c8c",
                           cursor: "pointer",
                           padding: "4px",
                        }}
                        onClick={(e) => e.stopPropagation()}
                     />
                  </Dropdown>
               </div>
            </div>
            <div
               style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  marginTop: 8,
               }}
            >
               <Row style={{ width: "100%" }}>
                  <Col span={4}>{getIcon(roomAndRadarData)}</Col>
               </Row>
            </div>
            {/* 🔥 第一行：保留的三项 + 信噪比 */}
            <Row gutter={[8, 8]} style={{ marginTop: 16 }}>
               <DataItem
                  icon={<HeartOutlined style={{ fontSize: 20, color: "red" }} />}
                  label='心率'
                  value={heartRate}
                  dataKey='heartRate'
                  unit=' 次'
               />
               <DataItem
                  icon={<CloudOutlined style={{ fontSize: 20, color: "#52c41a" }} />}
                  label='呼吸'
                  value={breathRate}
                  dataKey='breathRate'
                  unit=' 次'
               />
               <DataItem
                  icon={<img src={"/images/radar2.png"} alt='距离' style={{ width: 20, height: 20 }} />}
                  label='距离'
                  value={distance}
                  dataKey='distance'
                  formatter={(val) => (val === "-" ? "-" : (val / 100).toFixed(2) + "米")}
               />
               <DataItem
                  icon={<DashboardOutlined style={{ fontSize: 20, color: "#1890ff" }} />}
                  label='信噪比'
                  value={environmentInterference}
                  dataKey='environmentInterference'
               />
            </Row>

            {/* 🔥 第二行：血压、血氧、体温、手环心率 */}
            <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
               <DataItem
                  icon={<ThunderboltOutlined style={{ fontSize: 20, color: "#ff4d4f" }} />}
                  label='收缩压'
                  value={systolicPressure}
                  dataKey='systolicPressure'
                  unit=' mmHg'
               />
               <DataItem
                  icon={<ThunderboltOutlined style={{ fontSize: 20, color: "#ff7875" }} />}
                  label='舒张压'
                  value={diastolicPressure}
                  dataKey='diastolicPressure'
                  unit=' mmHg'
               />
               <DataItem
                  icon={<HeartOutlined style={{ fontSize: 20, color: "#fa8c16" }} />}
                  label='血氧'
                  value={spo2}
                  dataKey='spo2'
                  unit=' %'
               />
               <DataItem
                  icon={<ThunderboltOutlined style={{ fontSize: 20, color: "#fa541c" }} />}
                  label='体温'
                  value={bodyTemperature}
                  dataKey='bodyTemperature'
                  unit=' °C'
               />
            </Row>

            {/* 🔥 第三行：心率相关 */}
            <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
               <DataItem
                  icon={<HeartOutlined style={{ fontSize: 20, color: "#722ed1" }} />}
                  label='手环心率'
                  value={braceletHeartRate}
                  dataKey='braceletHeartRate'
                  unit=' 次'
               />
               <Col span={6}>
                  <div style={{ textAlign: "center" }}>
                     <HeartOutlined
                        style={{
                           fontSize: 20,
                           color: "#eb2f96",
                           cursor: "pointer",
                           opacity: showOximeterHeartRate ? 1 : 0.5,
                        }}
                        onClick={() => setShowOximeterHeartRate(!showOximeterHeartRate)}
                     />
                     <p style={{ fontSize: labelFontSize, fontWeight: "bold", margin: "4px 0 0 0" }}>血氧仪心率</p>
                     <p
                        style={{
                           fontSize: 12,
                           fontWeight: "bold",
                           margin: 0,
                           display: "inline-flex",
                           alignItems: "center",
                           gap: 4,
                        }}
                     >
                        {showOximeterHeartRate ? formatValue(oximeterHeartRate, " 次") : "已屏蔽"}
                        {showOximeterHeartRate && getTrendIcon("oximeterHeartRate", oximeterHeartRate)}
                     </p>
                  </div>
               </Col>
               <DataItem
                  icon={<LineChartOutlined style={{ fontSize: 20, color: "#13c2c2" }} />}
                  label='pNN50'
                  value={pnn50}
                  dataKey='pnn50'
               />
               <DataItem
                  icon={<LineChartOutlined style={{ fontSize: 20, color: "#2f54eb" }} />}
                  label='LF/HF'
                  value={lfHfRatio}
                  dataKey='lfHfRatio'
               />
            </Row>

            {/* 🔥 第四行：综合评测指标 */}
            <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
               <DataItem
                  icon={<ThunderboltOutlined style={{ fontSize: 20, color: "#faad14" }} />}
                  label='压力值'
                  value={stressEmotion}
                  dataKey='stressEmotion'
                  unit=' %'
               />
               <DataItem
                  icon={<ThunderboltOutlined style={{ fontSize: 20, color: "#fa8c16" }} />}
                  label='疲劳值'
                  value={fatigueTolerance}
                  dataKey='fatigueTolerance'
                  unit=' %'
               />
               <DataItem
                  icon={<ThunderboltOutlined style={{ fontSize: 20, color: "#f5222d" }} />}
                  label='心梗值'
                  value={heartAttackRisk}
                  dataKey='heartAttackRisk'
                  unit=' ‰'
               />
               <DataItem
                  icon={<CloudOutlined style={{ fontSize: 20, color: "#52c41a" }} />}
                  label='睡眠质量'
                  value={sleepQuality}
                  dataKey='sleepQuality'
               />
            </Row>
            <Row style={{ marginTop: 16 }}>
               <Col span={24} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 12, fontWeight: "bold", margin: 0 }}>{roomPersonnel.braceletStatus}</p>
               </Col>
            </Row>
         </Card>
      </Col>
   );
};

// 🔥 关键修复：移除 React.memo，确保数据更新时重新渲染
// 由于数据更新频繁，使用 React.memo 反而会阻止实时更新
export default PersonnelCard;
