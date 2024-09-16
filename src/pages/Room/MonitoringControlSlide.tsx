// components/RoomPage/MonitoringControlSlide.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, message, Row, Col } from "antd";
import axios from "axios";
import config from "../../config";
import { HeartOutlined } from "@ant-design/icons";
import { RoomInfo } from "./RoomInfo";
import RoomInfoFoot from "./RoomInfoFoot";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

interface MonitoringControlSlideProps {
   roomId: number;
   roomInfo: { name: string; age: number; gender: string };
   isMonitoringEnabled: boolean;
   setIsMonitoringEnabled: React.Dispatch<React.SetStateAction<boolean>>;
   onMonitoringStatusChange: (enabled: boolean) => void; // Callback to notify parent component
}
const cardHeight = 405,
   dataFromTop = 100;

const MonitoringControlSlide: React.FC<MonitoringControlSlideProps> = ({
   roomId,
   roomInfo,
   isMonitoringEnabled,
   setIsMonitoringEnabled,
   onMonitoringStatusChange,
}) => {
   const navigate = useNavigate();

   const roomData = useSelector((state: RootState) => state.data.rooms.find((room) => room.id === roomId)); // Get room data from Redux store

   useEffect(() => {
      // Fetch initial monitoring status when the component mounts
      const fetchRoomStatus = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/rooms/${roomId}`);
            setIsMonitoringEnabled(response.data.enabled);
         } catch (error) {
            console.error("Error fetching room status:", error);
         }
      };
      fetchRoomStatus();
   }, [roomId]);

   const handleToggleMonitoring = async () => {
      try {
         const newEnabledStatus = !isMonitoringEnabled;
         await axios.put(`${config.backend.url}/rooms/${roomId}`, { enabled: newEnabledStatus });
         setIsMonitoringEnabled(newEnabledStatus);
         onMonitoringStatusChange(newEnabledStatus); // Notify parent component
         message.success(`已切换为： ${newEnabledStatus ? "设防" : "撤防"} 状态`);
      } catch (error) {
         console.error("Error toggling monitoring:", error);
      }
   };

   return (
      <Card
         title={<RoomInfo roomName={roomInfo.name} age={roomInfo.age} gender={roomInfo.gender} type='' />}
         style={{ minHeight: 560 }}
      >
         {roomData?.personnel_id && isMonitoringEnabled ? (
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
                              {roomData?.distance} 米
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
                              {roomData?.heartRate} 次/分
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
                              {roomData?.breathRate} 次/分
                           </p>
                        </div>
                     </Card>
                  </Col>
               </Row>

               <RoomInfoFoot
                  lastUpdate={roomData?.time ? new Date(roomData?.time).toLocaleString() : ""}
                  onDisarmClick={handleToggleMonitoring}
               />
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
               {roomData?.personnel_id ? (
                  <Button
                     type='primary'
                     onClick={handleToggleMonitoring}
                     style={{ height: 48, width: 160, fontSize: 24, marginTop: 190 }}
                  >
                     设防
                  </Button>
               ) : (
                  <Button
                     type='primary'
                     onClick={() => navigate("/entry-exit-management")}
                     style={{ height: 48, width: 160, fontSize: 24, marginTop: 190 }}
                  >
                     进场
                  </Button>
               )}
            </div>
         )}
      </Card>
   );
};

export default MonitoringControlSlide;
