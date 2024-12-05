import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Card, Row, Col } from "antd";
import { HeartOutlined } from "@ant-design/icons";
import axios from "axios";
import config from "../../config/index";
import { RootState } from "../../store/index.js";
import RoomInfoFoot from "./RoomInfoFoot";
import { RoomInfo } from "./RoomInfo";

interface RoomStatusSlideProps {
   roomId: number;
   roomInfo: { name: string; age: number; gender: string; personnelId?: number | null };
}

const cardHeight = 405;
const dataFromTop = 100;

const RoomStatusSlide: React.FC<RoomStatusSlideProps> = ({ roomId, roomInfo }) => {
   const roomData = useSelector((state: RootState) => state.data.rooms.find((room) => room.id === roomId));
   const [roomStatus, setRoomStatus] = useState<any>(null);

   useEffect(() => {
      const fetchRoomStatus = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/rooms/${roomId}/status`);
            let { breath_rate, heart_rate_resting, heart_rate, breath_rate_resting } = response.data;
            breath_rate = breath_rate ? parseInt(breath_rate) : 0;
            heart_rate_resting = heart_rate_resting ? parseInt(heart_rate_resting) : 0;
            heart_rate = heart_rate ? parseInt(heart_rate) : 0;
            breath_rate_resting = breath_rate_resting ? parseInt(breath_rate_resting) : 0;
            setRoomStatus({ ...response.data, breath_rate, heart_rate_resting, heart_rate, breath_rate_resting });
         } catch (error) {
            console.error("Error fetching room status:", error);
         }
      };

      fetchRoomStatus();
   }, [roomId]);

   return (
      <Card
         title={
            <RoomInfo
               roomName={roomInfo.name}
               age={roomInfo.age}
               gender={roomInfo.gender || ""}
               room={roomData}
               type=''
            />
         }
         style={{ minHeight: 560 }}
      >
         {roomData?.personnel_id ? (
            <div>
               <Row gutter={16}>
                  <Col span={6}>
                     <Card title={<div style={{ textAlign: "center" }}>距离</div>} style={{ height: cardHeight }}>
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
                           <p style={{ fontSize: 20 * 1.3, fontWeight: "bold", margin: 0 }}>
                              {roomData?.distance || "-"} 米
                           </p>
                        </div>
                     </Card>
                  </Col>
                  <Col span={6}>
                     <Card title={<div style={{ textAlign: "center" }}>心跳</div>} style={{ height: cardHeight }}>
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
                           <HeartOutlined style={{ fontSize: 36 * 1.3, color: "red" }} />
                           <p style={{ fontSize: 20 * 1.3, fontWeight: "bold", margin: 0 }}>
                              {roomData?.heartRate || "-"} 次/分
                           </p>
                        </div>
                     </Card>
                  </Col>
                  <Col span={6}>
                     <Card title={<div style={{ textAlign: "center" }}>呼吸</div>} style={{ height: cardHeight }}>
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
                              style={{ width: 36 * 1.3, height: 36 * 1.3, color: "blue" }}
                           />
                           <p style={{ fontSize: 20 * 1.3, fontWeight: "bold", margin: 0 }}>
                              {roomData?.breathRate || "-"} 次/分
                           </p>
                        </div>
                     </Card>
                  </Col>
                  <Col span={6}>
                     <Card title={<div style={{ textAlign: "center" }}>环境干扰</div>} style={{ height: cardHeight }}>
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
                              src={"/images/radarzzz.png"}
                              alt='Environment Icon'
                              style={{ width: 36 * 1.3, height: 36 * 1.3, color: "blue" }}
                           />
                           <p style={{ fontSize: 20 * 1.3, fontWeight: "bold", margin: 0 }}>
                              {roomData?.environment || (roomData?.environment === 0 ? "0" : "-")}
                           </p>
                        </div>
                     </Card>
                  </Col>
               </Row>
               <RoomInfoFoot
                  lastUpdate={roomData?.time ? new Date(roomData?.time).toLocaleString() : ""}
                  pose={roomData?.person_pose || ""}
               />
            </div>
         ) : null}
      </Card>
   );
};

export default RoomStatusSlide;
