// components/RoomPage/MonitoringControlSlide.tsx
import React, { useState, useEffect } from "react";
import { Card, Button, message, Row, Col } from "antd";
import axios from "axios";
import config from "../../config";
import { HeartOutlined, RadarChartOutlined } from "@ant-design/icons";
import { RoomInfo } from "./RoomInfo";
import dayjs from "dayjs";
import RoomInfoFoot from "./RoomInfoFoot";

interface MonitoringControlSlideProps {
   roomId: number;
   isMonitoringEnabled: boolean;
   setIsMonitoringEnabled: React.Dispatch<React.SetStateAction<boolean>>;
   onMonitoringStatusChange: (enabled: boolean) => void; // Callback to notify parent component
}
const cardHeight = 405,
   dataFromTop = 100;

const MonitoringControlSlide: React.FC<MonitoringControlSlideProps> = ({
   roomId,
   isMonitoringEnabled,
   setIsMonitoringEnabled,
   onMonitoringStatusChange,
}) => {
   const currentData = {
      heartbeat: 67,
      breathing: 12,
      distance: 1.2,
      lastUpdate: "2023-10-10T10:10:10Z",
   };

   useEffect(() => {
      // Fetch initial monitoring status when the component mounts
      const fetchRoomStatus = async () => {
         try {
            setIsMonitoringEnabled(true);
            const response = await axios.get(`${config.backend.url}/rooms/${roomId}`);
            setIsMonitoringEnabled(response.data.enabled);
         } catch (error) {
            console.error("Error fetching room status:", error);
            // message.error("Failed to load room status");
         }
      };
      fetchRoomStatus();
   }, [roomId]);

   const handleToggleMonitoring = async () => {
      try {
         const newEnabledStatus = !isMonitoringEnabled;
         setIsMonitoringEnabled(newEnabledStatus);
         await axios.put(`${config.backend.url}/rooms/${roomId}`, { enabled: newEnabledStatus });
         onMonitoringStatusChange(newEnabledStatus); // Notify parent component
         message.success(`Monitoring ${newEnabledStatus ? "enabled" : "disabled"}`);
      } catch (error) {
         console.error("Error toggling monitoring:", error);
         //  message.error("Failed to toggle monitoring");
      }
   };

   return (
      <Card title={<RoomInfo roomId={roomId} age={51} gender={"男"} type='' />} style={{ minHeight: 560 }}>
         {isMonitoringEnabled ? (
            <div>
               <Row gutter={16}>
                  <Col span={8}>
                     <Card
                        title={
                           <div style={{ textAlign: "center" }}>距离</div> // 标题居中
                        }
                        style={{ height: cardHeight }} // 设置高度为 300
                     >
                        <div
                           style={{
                              textAlign: "center",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              alignItems: "center",
                              height: "100%",
                              marginTop: dataFromTop,
                           }}
                        >
                           <img
                              src={"/images/radar2.png"}
                              alt='Radar Icon'
                              style={{ width: 36 * 1.3, height: 36 * 1.3, color: "blue" }}
                           />
                           <p
                              style={{
                                 fontSize: 20 * 1.3,
                                 fontWeight: "bold",
                                 margin: 0,
                              }}
                           >
                              {currentData.distance} 米
                           </p>
                        </div>
                     </Card>
                  </Col>
                  <Col span={8}>
                     <Card
                        title={
                           <div style={{ textAlign: "center" }}>心跳</div> // 标题居中
                        }
                        style={{ height: cardHeight }} // 设置高度为 360
                     >
                        <div
                           style={{
                              textAlign: "center",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              alignItems: "center",
                              height: "100%",
                              marginTop: dataFromTop,
                           }}
                        >
                           <HeartOutlined
                              style={{ fontSize: 36 * 1.3, color: "red" }} // 图标放大 30%
                           />
                           <p
                              style={{
                                 fontSize: 20 * 1.3,
                                 fontWeight: "bold",
                                 margin: 0,
                              }}
                           >
                              {currentData.heartbeat} 次/分
                           </p>
                        </div>
                     </Card>
                  </Col>
                  <Col span={8}>
                     <Card
                        title={
                           <div style={{ textAlign: "center" }}>呼吸</div> // 标题居中
                        }
                        style={{ height: cardHeight }} // 设置高度为 360
                     >
                        <div
                           style={{
                              textAlign: "center",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              alignItems: "center",
                              height: "100%",
                              marginTop: dataFromTop,
                           }}
                        >
                           <img
                              src={"/images/ll.png"}
                              alt='Breath Rate Icon'
                              style={{ width: 36 * 1.3, height: 36 * 1.3, color: "blue" }} // 图标放大 30%
                           />
                           <p
                              style={{
                                 fontSize: 20 * 1.3,
                                 fontWeight: "bold",
                                 margin: 0,
                              }}
                           >
                              {currentData.breathing} 次/分
                           </p>
                        </div>
                     </Card>
                  </Col>
               </Row>

               <RoomInfoFoot lastUpdate={currentData.lastUpdate} onDisarmClick={handleToggleMonitoring} />
            </div>
         ) : (
            <div
               style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  alignContent: "center",
               }}
            >
               <Button
                  type='primary'
                  onClick={handleToggleMonitoring}
                  style={{ height: 48, width: 160, fontSize: 24, marginTop: 190 }}
               >
                  设防
               </Button>
            </div>
         )}
      </Card>
   );
};

export default MonitoringControlSlide;
