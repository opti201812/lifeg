// pages/Room/RoomStatusSlide.tsx

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Card, Row, Col, message } from "antd";
import { HeartOutlined } from "@ant-design/icons";
import axios from "axios";
import config from "../../config/index";
import { RootState } from "../../store/index.js";
import RoomInfoFoot from "./RoomInfoFoot";
import { RoomInfo } from "./RoomInfo";
import { RadarData } from "../../types";
import { theme } from "../../styles/theme";
import { getBatteryStatus } from "../../utils";
import { useNavigate } from "react-router-dom";

interface RoomStatusSlideProps {
   personnelId: number | null; // 使用人员ID作为入参
   roomInfo: { name: string; age: number; gender: string; associationId: string; templateId?: number };
   isActive: boolean;
}

const RoomStatusSlide: React.FC<RoomStatusSlideProps> = ({ personnelId, roomInfo, isActive }) => {
   // 获取最新设备数据
   const latestDeviceData = useSelector((state: RootState) => {
      if (!personnelId) return null;
      return state.data.personDeviceData[personnelId] || null;
   });

   // 上一次的雷达数据和手环数据
   const [previousRadarData, setPreviousRadarData] = useState<any>(null);
   const [previousBraceletData, setPreviousBraceletData] = useState<any>(null);

   // 上一次的雷达和手环时间戳
   const [previousRadarTimestamp, setPreviousRadarTimestamp] = useState<string | null>(null);
   const [previousBraceletTimestamp, setPreviousBraceletTimestamp] = useState<string | null>(null);

   // 添加状态来跟踪数据是否过期
   const [isDataStale, setIsDataStale] = useState(false);

   // 新增状态用于强制刷新
   const [refreshCounter, setRefreshCounter] = useState(0);

   // 更新上一次的雷达和手环数据
   useEffect(() => {
      if (!isActive) {
         return;
      }
      if (latestDeviceData) {
         if (latestDeviceData.devices?.radar && latestDeviceData.devices.radar.length > 0) {
            setPreviousRadarData(latestDeviceData.devices.radar);
            setPreviousRadarTimestamp(latestDeviceData.time || new Date().toISOString());
         }
         if (latestDeviceData.devices?.bracelet) {
            setPreviousBraceletData(latestDeviceData.devices.bracelet);
            setPreviousBraceletTimestamp(latestDeviceData.time || new Date().toISOString());
         }
      }
   }, [latestDeviceData, isActive]);

   // 添加定时器，每5秒检查一次数据过期情况
   useEffect(() => {
      const interval = setInterval(() => {
         setRefreshCounter((prev) => prev + 1);
      }, 5000); // 5秒检查一次

      return () => clearInterval(interval); // 组件卸载时清除定时器
   }, []);

   // 检查数据是否过期的逻辑
   const now = Date.now();
   const isRadarDataExpired = previousRadarTimestamp ? now - new Date(previousRadarTimestamp).getTime() > 10000 : true;
   const isBraceletDataExpired = previousBraceletTimestamp
      ? now - new Date(previousBraceletTimestamp).getTime() > 10000
      : true;

   // 使用 theme 中的颜色值
   const staleStyle = isDataStale
      ? {
           animation: "blink 1s infinite",
           backgroundColor: theme.secondaryColor, // 使用 secondaryColor
        }
      : {};

   // 使用最新数据或上一次的数据，并根据过期状态显示
   // 空数组视同null，避免清除之前的数据
   const radarData =
      latestDeviceData?.devices?.radar && latestDeviceData.devices.radar.length > 0
         ? latestDeviceData.devices.radar
         : previousRadarData || [];
   const braceletData = latestDeviceData?.devices?.bracelet || previousBraceletData || null;

   // 选择环境值较大的雷达数据
   let selectedRadarData = null;
   const filteredRadarData = radarData.filter((r: RadarData) => r.environmentInterference > 0);

   if (filteredRadarData.length > 0) {
      selectedRadarData = filteredRadarData.reduce((prev: RadarData, current: RadarData) =>
         prev.environmentInterference > current.environmentInterference ? prev : current
      );
   }

   // 计算电量百分比
   const { status: batteryStatus } = getBatteryStatus(braceletData?.batteryVoltage);
   const CARD_HEIGHT = 160;

   // 统一样式配置
   const styles = {
      // 卡片高度配置
      heights: {
         bracelet: CARD_HEIGHT, // 手环卡片高度
         radar: CARD_HEIGHT, // 雷达卡片高度（原来的一半）
      },

      // 容器样式
      containers: {
         braceletSection: {
            marginBottom: 24,
            padding: 16,
            background: "#f0f2f5",
            borderRadius: 8,
         },
         radarSection: {
            padding: 16,
            background: "#f8f9fa",
            borderRadius: 8,
         },
      },

      // 卡片样式
      card: {
         base: (height: number) => ({
            height,
            overflow: "hidden" as const,
         }),
         body: (height: number) => ({
            padding: "8px",
            height: `calc(${height}px - 45px)`,
         }),
         title: {
            textAlign: "center" as const,
         },
      },

      // 内容容器样式
      content: {
         base: {
            textAlign: "center" as const,
            padding: 8,
            display: "flex",
            flexDirection: "column" as const,
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
         },
      },

      // 图标样式
      icons: {
         heartIcon: {
            fontSize: 24,
            color: "red",
         },
         imageIcon: {
            width: 24,
            height: 24,
            verticalAlign: "middle" as const,
            display: "inline-block" as const,
         },
      },

      // 文本样式
      text: {
         value: {
            fontSize: 16,
            fontWeight: "bold" as const,
            margin: 0,
         },
         sectionTitle: {
            marginBottom: 8,
            fontWeight: 500,
            color: "#666",
         },
      },
   };

   // 渲染卡片的通用函数
   const renderCard = (title: string, icon: React.ReactNode, value: string, height: number) => (
      <Card
         title={<div style={styles.card.title}>{title}</div>}
         style={styles.card.base(height)}
         styles={{ body: styles.card.body(height) }}
      >
         <div style={styles.content.base}>
            {icon}
            <p style={styles.text.value}>{value}</p>
         </div>
      </Card>
   );

   const navigate = useNavigate();

   // 在组件内部添加 selector 来获取 personnel 数据
   const personnel = useSelector((state: any) => state.data.personnel || []);

   // 根据 personnelId 查找对应的人员信息
   const currentPersonnel = personnel.find((p: any) => p.id === personnelId);

   return (
      <Card
         title={
            <RoomInfo
               roomName={roomInfo.name}
               age={currentPersonnel?.age || ""}
               gender={currentPersonnel?.gender === "male" ? "男" : "女"}
               room={{ ...latestDeviceData, devices: { radar: radarData, bracelet: braceletData } }}
               type=''
            />
         }
         // style={{ height: 600 }}
      >
         <div>
            {/* 第一行：手环数据 */}
            <div style={{ ...styles.containers.braceletSection, ...staleStyle }}>
               <div style={styles.text.sectionTitle}>手环数据</div>
               <Row gutter={16}>
                  <Col span={6}>
                     {renderCard(
                        "心跳",
                        <HeartOutlined style={styles.icons.heartIcon} />,
                        `${!isBraceletDataExpired ? braceletData?.heartRate || "-" : "-"} 次/分`,
                        styles.heights.bracelet
                     )}
                  </Col>
                  <Col span={6}>
                     {renderCard(
                        "电池状态",
                        <img src='/images/battery.png' alt='Battery' style={styles.icons.imageIcon} />,
                        `${!isBraceletDataExpired ? (batteryStatus !== null ? `${batteryStatus}` : "-") : "-"}`,
                        styles.heights.bracelet
                     )}
                  </Col>
                  <Col span={6}>
                     {renderCard(
                        "SOS",
                        <img src='/images/sos.png' alt='SOS' style={styles.icons.imageIcon} />,
                        `${!isBraceletDataExpired ? (braceletData?.buttonStatus === 1 ? "异常" : "正常") : "-"}`,
                        styles.heights.bracelet
                     )}
                  </Col>
                  <Col span={6}>
                     {renderCard(
                        "状态",
                        <img src='/images/status.png' alt='Status' style={styles.icons.imageIcon} />,
                        `${!isBraceletDataExpired ? (braceletData?.tamperStatus === 1 ? "异常" : "正常") : "-"}`,
                        styles.heights.bracelet
                     )}
                  </Col>
               </Row>
            </div>

            {/* 第二行：雷达数据 */}
            {roomInfo.templateId !== 2 && (
               <div style={{ ...styles.containers.radarSection, ...staleStyle }}>
                  <div style={styles.text.sectionTitle}>雷达数据</div>
                  <Row gutter={16}>
                     <Col span={6}>
                        {renderCard(
                           "心跳",
                           <HeartOutlined style={{ ...styles.icons.heartIcon, fontSize: 20 }} />,
                           `${!isRadarDataExpired ? selectedRadarData?.heartRate || "-" : "-"} 次/分`,
                           styles.heights.radar
                        )}
                     </Col>
                     <Col span={6}>
                        {renderCard(
                           "呼吸",
                           <img src='/images/ll.png' alt='Breath' style={styles.icons.imageIcon} />,
                           `${!isRadarDataExpired ? selectedRadarData?.breathRate || "-" : "-"} 次/分`,
                           styles.heights.radar
                        )}
                     </Col>
                     <Col span={6}>
                        {renderCard(
                           "距离",
                           <img src='/images/radar2.png' alt='Distance' style={styles.icons.imageIcon} />,
                           `${
                              !isRadarDataExpired && selectedRadarData?.distance
                                 ? (selectedRadarData?.distance / 100).toFixed(2)
                                 : "-"
                           } 米`,
                           styles.heights.radar
                        )}
                     </Col>
                     <Col span={6}>
                        {renderCard(
                           "环境干扰",
                           <img src='/images/radarzzz.png' alt='Environment' style={styles.icons.imageIcon} />,
                           `${
                              !isRadarDataExpired
                                 ? selectedRadarData?.environmentInterference ||
                                   (selectedRadarData?.environmentInterference === 0 ? "0" : "-")
                                 : "-"
                           }`,
                           styles.heights.radar
                        )}
                     </Col>
                  </Row>
               </div>
            )}

            <RoomInfoFoot
               lastUpdate={
                  previousRadarTimestamp || previousBraceletTimestamp
                     ? new Date(previousRadarTimestamp || previousBraceletTimestamp!).toLocaleString()
                     : ""
               }
               pose={latestDeviceData?.person_pose || ""}
               onDisarmClick={async () => {
                  try {
                     const associationId = roomInfo?.associationId;
                     if (!associationId) {
                        message.error("未找到关联ID，无法撤防");
                        return;
                     }
                     await axios.delete(`${config.backend.url}/associations/${associationId}`);
                     message.success("撤防成功");
                     navigate("/new-overview", { replace: true });
                  } catch (error) {
                     console.error("撤防失败:", error);
                     message.error("撤防失败");
                  }
               }}
            />
         </div>
      </Card>
   );
};

export default RoomStatusSlide;
