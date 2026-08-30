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
import { normalizeRadarDistanceToMeters } from "../../shared/src/utils/radarDistance";
import { useNavigate } from "react-router-dom";
import { RADAR_DATA_EXPIRE_TIME, BRACELET_HOLD_TIME } from "../../components/Overview/utils/constants";
import { resolveBraceletField } from "../../shared/src/utils/braceletFieldHold";

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

   // 上一次的雷达数据和手环数据（手环字段级保持由模块级缓存承担，无需在此缓存整包）
   const [previousRadarData, setPreviousRadarData] = useState<any>(null);

   // 上一次的雷达和手环时间戳（毫秒时间戳，number）
   const [previousRadarTimestamp, setPreviousRadarTimestamp] = useState<number | null>(null);
   const [previousBraceletTimestamp, setPreviousBraceletTimestamp] = useState<number | null>(null);

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
         if (latestDeviceData.devices?.radar) {
            setPreviousRadarData(latestDeviceData.devices.radar);
            // 时间戳优先用雷达设备自身的 timestamp（毫秒数），回退到包时间戳/当前时刻
            const radarArr = Array.isArray(latestDeviceData.devices.radar)
               ? latestDeviceData.devices.radar
               : [latestDeviceData.devices.radar];
            const latestRadar = radarArr[radarArr.length - 1];
            const radarTs =
               latestRadar?.timestamp ??
               latestDeviceData.timestamp ??
               Date.now();
            setPreviousRadarTimestamp(radarTs);
         }
         if (latestDeviceData.devices?.bracelet) {
            // 时间戳优先用手环设备自身的 timestamp（毫秒数），回退到包时间戳/当前时刻
            const braceletTs =
               latestDeviceData.devices.bracelet.timestamp ??
               latestDeviceData.timestamp ??
               Date.now();
            setPreviousBraceletTimestamp(braceletTs);
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

   // 检查数据是否过期的逻辑（雷达/手环各自使用常量窗口，避免硬编码 10s 导致手环过早清除）
   const now = Date.now();
   const isRadarDataExpired = previousRadarTimestamp
      ? now - previousRadarTimestamp > RADAR_DATA_EXPIRE_TIME
      : true;

   // 使用 theme 中的颜色值
   const staleStyle = isDataStale
      ? {
           animation: "blink 1s infinite",
           backgroundColor: theme.secondaryColor, // 使用 secondaryColor
        }
      : {};

   // 使用最新数据或上一次的数据，并根据过期状态显示
   const radarData = latestDeviceData?.devices?.radar || previousRadarData || [];

   // 🔥 手环字段级保持：仅用最新包的字段做保持。
   // 新包某字段为 null/缺失时，resolveBraceletField 用模块级缓存判定：
   //   未超期 → 保留该字段上次有效值；超期 → 返回 '-'。
   // 最新包整体无 bracelet 时传入 undefined，让缓存自行判定每个字段是否过期。
   const latestBraceletRaw = latestDeviceData?.devices?.bracelet || null;
   const nowTs = Date.now();
   const pid = personnelId ?? -1;
   const heldBraceletData = latestBraceletRaw
      ? {
           ...latestBraceletRaw,
           heartRate: resolveBraceletField(pid, "heartRate", latestBraceletRaw.heartRate, BRACELET_HOLD_TIME, nowTs),
           batteryVoltage: resolveBraceletField(pid, "batteryVoltage", latestBraceletRaw.batteryVoltage, BRACELET_HOLD_TIME, nowTs),
           buttonStatus: resolveBraceletField(pid, "buttonStatus", latestBraceletRaw.buttonStatus, BRACELET_HOLD_TIME, nowTs),
           tamperStatus: resolveBraceletField(pid, "tamperStatus", latestBraceletRaw.tamperStatus, BRACELET_HOLD_TIME, nowTs),
        }
      : {
           heartRate: resolveBraceletField(pid, "heartRate", undefined, BRACELET_HOLD_TIME, nowTs),
           batteryVoltage: resolveBraceletField(pid, "batteryVoltage", undefined, BRACELET_HOLD_TIME, nowTs),
           buttonStatus: resolveBraceletField(pid, "buttonStatus", undefined, BRACELET_HOLD_TIME, nowTs),
           tamperStatus: resolveBraceletField(pid, "tamperStatus", undefined, BRACELET_HOLD_TIME, nowTs),
        };

   // 选择环境干扰较小的雷达数据（干扰越低信号越佳；0=无干扰为合法最佳值）
   let selectedRadarData = null;
   const filteredRadarData = radarData.filter(
      (r: RadarData) => r.environmentInterference != null && r.environmentInterference >= 0
   );

   if (filteredRadarData.length > 0) {
      selectedRadarData = filteredRadarData.reduce((prev: RadarData, current: RadarData) =>
         prev.environmentInterference < current.environmentInterference ? prev : current
      );
   }

   // 计算电量百分比
   const { status: batteryStatus } = getBatteryStatus(heldBraceletData?.batteryVoltage);
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
               room={{ ...latestDeviceData, devices: { radar: radarData, bracelet: heldBraceletData } }}
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
                        `${heldBraceletData?.heartRate && heldBraceletData.heartRate !== "-" ? `${heldBraceletData.heartRate}` : "-"} 次/分`,
                        styles.heights.bracelet
                     )}
                  </Col>
                  <Col span={6}>
                     {renderCard(
                        "电池状态",
                        <img src='/images/battery.png' alt='Battery' style={styles.icons.imageIcon} />,
                        `${batteryStatus !== null && batteryStatus !== "-" ? `${batteryStatus}` : "-"}`,
                        styles.heights.bracelet
                     )}
                  </Col>
                  <Col span={6}>
                     {renderCard(
                        "SOS",
                        <img src='/images/sos.png' alt='SOS' style={styles.icons.imageIcon} />,
                        `${heldBraceletData?.buttonStatus === 1 ? "异常" : heldBraceletData?.buttonStatus === 0 ? "正常" : "-"}`,
                        styles.heights.bracelet
                     )}
                  </Col>
                  <Col span={6}>
                     {renderCard(
                        "状态",
                        <img src='/images/status.png' alt='Status' style={styles.icons.imageIcon} />,
                        `${heldBraceletData?.tamperStatus === 1 ? "异常" : heldBraceletData?.tamperStatus === 0 ? "正常" : "-"}`,
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
                                 ? (normalizeRadarDistanceToMeters(selectedRadarData?.distance) ?? 0).toFixed(2)
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
                     navigate("/dashboard/overview", { replace: true });
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
