// pages/Room/index.tsx

import React, { useState, useEffect, useRef } from "react";
import { Carousel, Card, Row, Col, message, Button } from "antd";
import { useSelector } from "react-redux";
import DailyDataSlide from "./DailyDataSlide";
import WeeklyDataSlide from "./WeeklyDataSlide";
import MonitoringControlSlide from "./MonitoringControlSlide";
import axios from "axios";
import config from "../../config/index";
import { RootState } from "../../store/index.js";
import { LeftOutlined, RightOutlined } from "@ant-design/icons"; // 引入手動切換按鈕的圖標

interface User {
   id: number;
   name: string;
   gender: string;
   age: number;
   role: "user" | "admin";
}

// Define Props interface for clarity
interface PropsWithRoomId {
   roomId: number | null;
   age: number;
   gender: string;
}

const RoomPage: React.FC<PropsWithRoomId> = ({ roomId }) => {
   const [roomInfo, setRoomInfo] = useState({ name: "", age: 0, gender: "", roomId: 0, personnelId: 0 }); // Track room info
   const roomData = useSelector((state: RootState) => state.data.rooms.find((room) => room.id === roomId)); // Get room data from Redux store
   const carouselRef = useRef<any>(null); // 创建 carouselRef

   const [isMonitoringEnabled, setIsMonitoringEnabled] = useState(roomData?.enabled || false); // Track monitoring status
   if (!roomId) return;

   useEffect(() => {
      if (!roomId) return;

      // Fetch initial room data and personnel details
      const fetchData = async () => {
         try {
            const roomResponse = await axios.get(`${config.backend.url}/rooms/${roomId}`);
            const roomData = roomResponse.data;

            // Fetch personnel details if personnel_id is present
            let personnelData = null;
            if (roomData.personnel_id) {
               const personnelResponse = await axios.get(`${config.backend.url}/personnel/${roomData.personnel_id}`, {
                  withCredentials: true,
               });
               personnelData = personnelResponse.data;
            }

            setRoomInfo({
               ...roomData,
               age: personnelData?.age,
               gender: personnelData?.gender,
               roomId,
               personnelId: roomData.personnel_id,
            });
            setIsMonitoringEnabled(roomData.enabled);
         } catch (error) {
            console.error("Error fetching room data:", error);
            message.error("获取房间信息失败！");
         }
      };

      fetchData();
   }, [roomId]);
   const handleMonitoringStatusChange = (enabled: boolean) => {
      setIsMonitoringEnabled(enabled);
   };

   return (
      <div
         style={{
            margin: "0 auto",
            maxWidth: "1000px",
            width: "100%",
            height: "100%",
         }}
      >
         <Carousel autoplay={isMonitoringEnabled} autoplaySpeed={10000} ref={carouselRef}>
            <MonitoringControlSlide
               roomId={roomId}
               roomInfo={roomInfo}
               isMonitoringEnabled={isMonitoringEnabled || false}
               setIsMonitoringEnabled={setIsMonitoringEnabled}
               onMonitoringStatusChange={handleMonitoringStatusChange}
            />
            <DailyDataSlide roomInfo={roomInfo} isMonitoringEnabled={isMonitoringEnabled || false} />
            <WeeklyDataSlide roomInfo={roomInfo} isMonitoringEnabled={isMonitoringEnabled || false} />
         </Carousel>
         <div style={{ marginTop: "10px", textAlign: "center" }}>
            {" "}
            {/* 添加手動切換按鈕 */}
            <Button
               icon={<LeftOutlined />}
               onClick={() => carouselRef.current?.prev()}
               style={{ marginRight: "10px" }}
            />
            <Button icon={<RightOutlined />} onClick={() => carouselRef.current?.next()} />
         </div>
      </div>
   );
};

export default RoomPage;
