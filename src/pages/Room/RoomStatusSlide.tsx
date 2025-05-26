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

interface RoomStatusSlideProps {
   personnelId: number | null; // 使用人员ID作为入参
   roomInfo: { name: string; age: number; gender: string; associationId: string };
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

   // 更新上一次的雷达和手环数据
   useEffect(() => {
      if (!isActive) {
         return;
      }
      if (latestDeviceData) {
         if (latestDeviceData.devices?.radar) {
            setPreviousRadarData(latestDeviceData.devices.radar);
            setPreviousRadarTimestamp(latestDeviceData.time || new Date().toISOString());
         }
         if (latestDeviceData.devices?.bracelet) {
            setPreviousBraceletData(latestDeviceData.devices.bracelet);
            setPreviousBraceletTimestamp(latestDeviceData.time || new Date().toISOString());
         }
      }
   }, [latestDeviceData, isActive]);

   // 检查数据是否过期的逻辑
   useEffect(() => {
      const checkDataStale = () => {
         const now = new Date();
         const lastUpdate = previousRadarTimestamp || previousBraceletTimestamp;
         if (lastUpdate) {
            const lastUpdateTime = new Date(lastUpdate);
            const timeDiff = now.getTime() - lastUpdateTime.getTime();
            setIsDataStale(timeDiff > 5 * 60 * 1000); // 5分钟
         } else {
            setIsDataStale(false);
         }
      };

      const interval = setInterval(checkDataStale, 10000); // 每10秒检查一次
      return () => clearInterval(interval);
   }, [previousRadarTimestamp, previousBraceletTimestamp]);

   // 使用 theme 中的颜色值
   const staleStyle = isDataStale
      ? {
           animation: "blink 1s infinite",
           backgroundColor: theme.secondaryColor, // 使用 secondaryColor
        }
      : {};

   // 使用最新数据或上一次的数据
   const radarData = latestDeviceData?.devices?.radar || previousRadarData || [];
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
   const CARD_HEIGHT = 20;

   return (
      <Card
         title={
            <RoomInfo
               roomName={roomInfo.name}
               age={roomInfo.age}
               gender={roomInfo.gender || ""}
               room={{ ...latestDeviceData, devices: { radar: radarData, bracelet: braceletData } }}
               type=''
            />
         }
         // style={{ height: 600 }}
      >
         <div>
            {/* 第一行：手环数据 */}
            <div
               style={{
                  marginBottom: 24,
                  padding: 16,
                  background: "#f0f2f5",
                  borderRadius: 8,
                  ...staleStyle,
               }}
            >
               <div style={{ marginBottom: 8, fontWeight: 500, color: "#666" }}>手环数据</div>
               <Row gutter={16}>
                  <Col span={6}>
                     <Card
                        title={<div style={{ textAlign: "center" }}>心跳</div>}
                        size='small'
                        style={{ height: CARD_HEIGHT, overflow: "hidden" }}
                        styles={{ body: { padding: "8px", height: `calc(${CARD_HEIGHT} - 45px)` } }}
                     >
                        <div style={{ textAlign: "center", padding: 8 }}>
                           <HeartOutlined style={{ fontSize: 24, color: "red" }} />
                           <p style={{ fontSize: 20, fontWeight: "bold", margin: "10px 0 0" }}>
                              {braceletData?.heartRate || "-"} 次/分
                           </p>
                        </div>
                     </Card>
                  </Col>
                  <Col span={6}>
                     <Card
                        title={<div style={{ textAlign: "center" }}>电池状态</div>}
                        style={{ height: CARD_HEIGHT }}
                        styles={{ body: { padding: "8px", height: `calc(${CARD_HEIGHT}px - 45px)` } }}
                     >
                        <div
                           style={{
                              textAlign: "center",
                              padding: 8,
                              alignSelf: "center",
                           }}
                        >
                           <img
                              src='/images/battery.png'
                              alt='Battery'
                              style={{
                                 width: 24,
                                 height: 24,
                              }}
                           />
                           <p style={{ fontSize: 16, fontWeight: "bold", margin: 0 }}>
                              {batteryStatus !== null ? `${batteryStatus}` : "-"}
                           </p>
                        </div>
                     </Card>
                  </Col>
                  <Col span={6}>
                     <Card
                        title={<div style={{ textAlign: "center" }}>SOS</div>}
                        style={{ height: CARD_HEIGHT }}
                        styles={{ body: { padding: "8px", height: `calc(${CARD_HEIGHT}px - 45px)` } }}
                     >
                        <div style={{ textAlign: "center", padding: 8, alignSelf: "center" }}>
                           <img src='/images/sos.png' alt='SOS' style={{ width: 24, height: 24 }} />
                           <p style={{ fontSize: 16, fontWeight: "bold", margin: 0 }}>
                              {braceletData?.buttonStatus === 1 ? "异常" : "正常"}
                           </p>
                        </div>
                     </Card>
                  </Col>
                  <Col span={6}>
                     <Card
                        title={<div style={{ textAlign: "center" }}>状态</div>}
                        style={{ height: CARD_HEIGHT }}
                        styles={{ body: { padding: "8px", height: `calc(${CARD_HEIGHT}px - 45px)` } }}
                     >
                        <div style={{ textAlign: "center", padding: 8, alignSelf: "center" }}>
                           <img src='/images/status.png' alt='Status' style={{ width: 24, height: 24 }} />
                           <p style={{ fontSize: 16, fontWeight: "bold", margin: 0 }}>
                              {braceletData?.tamperStatus === 1 ? "异常" : "正常"}
                           </p>
                        </div>
                     </Card>
                  </Col>
               </Row>
            </div>

            {/* 第二行：雷达数据 */}
            <div
               style={{
                  padding: 16,
                  background: "#f8f9fa",
                  borderRadius: 8,
                  ...staleStyle,
               }}
            >
               <div style={{ marginBottom: 8, fontWeight: 5, color: "#666" }}>雷达数据</div>
               <Row gutter={16}>
                  <Col span={6}>
                     <Card
                        title={<div style={{ textAlign: "center" }}>心跳</div>}
                        style={{ height: 180 }}
                        styles={{ body: { padding: "8px", height: `calc(180px - 45px)` } }}
                     >
                        <div style={{ textAlign: "center", padding: 8, alignSelf: "center" }}>
                           <HeartOutlined style={{ fontSize: 20, color: "red" }} />
                           <p style={{ fontSize: 16, fontWeight: "bold", margin: 0 }}>
                              {selectedRadarData?.heartRate || "-"} 次/分
                           </p>
                        </div>
                     </Card>
                  </Col>
                  <Col span={6}>
                     <Card
                        title={<div style={{ textAlign: "center" }}>呼吸</div>}
                        style={{ height: 180 }}
                        styles={{ body: { padding: "8px", height: `calc(180px - 45px)` } }}
                     >
                        <div style={{ textAlign: "center", padding: 8, alignSelf: "center" }}>
                           <img src='/images/ll.png' alt='Breath' style={{ width: 24, height: 24 }} />
                           <p style={{ fontSize: 16, fontWeight: "bold", margin: 0 }}>
                              {selectedRadarData?.breathRate || "-"} 次/分
                           </p>
                        </div>
                     </Card>
                  </Col>
                  <Col span={6}>
                     <Card
                        title={<div style={{ textAlign: "center" }}>距离</div>}
                        style={{ height: 180 }}
                        styles={{ body: { padding: "8px", height: `calc(180px - 45px)` } }}
                     >
                        <div style={{ textAlign: "center", padding: 8, alignSelf: "center" }}>
                           <img src='/images/radar2.png' alt='Distance' style={{ width: 24, height: 24 }} />
                           <p style={{ fontSize: 16, fontWeight: "bold", margin: 0 }}>
                              {selectedRadarData?.distance ? (selectedRadarData?.distance / 100).toFixed(2) : "-"} 米
                           </p>
                        </div>
                     </Card>
                  </Col>
                  <Col span={6}>
                     <Card
                        title={<div style={{ textAlign: "center" }}>环境干扰</div>}
                        style={{ height: 180 }}
                        styles={{ body: { padding: "8px", height: `calc(180px - 45px)` } }}
                     >
                        <div style={{ textAlign: "center", padding: 8, alignSelf: "center" }}>
                           <img src='/images/radarzzz.png' alt='Environment' style={{ width: 24, height: 24 }} />
                           <p style={{ fontSize: 16, fontWeight: "bold", margin: 0 }}>
                              {selectedRadarData?.environmentInterference ||
                                 (selectedRadarData?.environmentInterference === 0 ? "0" : "-")}
                           </p>
                        </div>
                     </Card>
                  </Col>
               </Row>
            </div>

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
                     window.location.reload();
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
