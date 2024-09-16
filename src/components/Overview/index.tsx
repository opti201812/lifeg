// components/Overview/index.tsx

import React, { useState, useEffect, useRef } from "react";
import { Card, Row, Col, Button, Tag, Typography, message } from "antd";
import { HeartOutlined, BellOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "./Overview.css";
import RoomPage from "../../pages/Room";
import { useDispatch, useSelector } from "react-redux";
import { MEDICAL_HISTORIES, Room, User } from "../../types";
import axios from "axios";
import config from "../../config";
import { RootState } from "../../store";
import { setRooms } from "../../store/dataSlice";

const Overview: React.FC = () => {
   const dispatch = useDispatch();
   const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
   const rooms = useSelector((state: RootState) => state.data.rooms); // Get rooms from Redux store
   const alarms = useSelector((state: RootState) => state.data.alarms); // Get alarms from Redux store

   useEffect(() => {
      // Fetch room data from API
      const fetchRooms = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/rooms`);
            const roomsData = response.data.map((room: Room) => ({
               ...room,
               enabled: room.enabled as unknown,
            }));
            dispatch(setRooms(roomsData || [])); // Dispatch the setRooms action
         } catch (error) {
            console.error("Error fetching rooms:", error);
            message.error("获取房间信息失败！");
         }
      };
      fetchRooms();
   }, []);

   const getTagInfo = (room: Room) => {
      if (!room.personnel_id) {
         return { text: "无人", color: "gray" };
      } else if (!room.enabled) {
         return { text: "未设防", color: "red" };
      } else if (isInRestrictedSchedule(room)) {
         return { text: "搁置时段", color: "orange" };
      } else if (room.networkFailure) {
         return { text: "网络故障", color: "red" };
      } else if (room.radarFailure) {
         return { text: "雷达故障", color: "red" };
      } else if (room.radarAbnormal) {
         return { text: "雷达异常", color: "red" };
      } else {
         return { text: "采集中", color: "green" };
      }
   };

   // Function to check if current time is within restricted schedule
   const isInRestrictedSchedule = (room: Room) => {
      if (!room.personnel_id || !room.schedules || room.schedules.length === 0) {
         return false; // No personnel or schedules, not restricted
      }

      const now = dayjs();
      const currentDay = now.day() + 1; // 0 (Sunday) to 6 (Saturday), convert to 1-7
      const currentHour = now.hour();
      const currentMinute = now.minute();

      for (const schedule of room.schedules) {
         const daysOfWeek = schedule.days_of_week.split(",").map(Number);
         if (!daysOfWeek.includes(currentDay)) {
            continue; // Schedule doesn't apply to this day
         }

         const [startHour, startMinute] = schedule.start_time.split(":").map(Number);
         const [endHour, endMinute] = schedule.end_time.split(":").map(Number);

         // Handle cross-day schedules
         if (endHour < startHour) {
            if (
               currentHour > startHour ||
               (currentHour === startHour && currentMinute >= startMinute) ||
               currentHour < endHour ||
               (currentHour === endHour && currentMinute <= endMinute)
            ) {
               return true;
               // Within restricted time
            }
         } else {
            // Schedule within the same day
            if (
               (currentHour > startHour && currentHour < endHour) ||
               (currentHour === startHour && currentMinute >= startMinute) ||
               (currentHour === endHour && currentMinute <= endMinute)
            ) {
               return true; // Within restricted time
            }
         }
      }

      return false; // Not within any restricted schedule
   };

   return (
      <div>
         <h2>总览</h2>
         {selectedRoomId ? (
            <RoomPage roomId={selectedRoomId} gender='' age={0} />
         ) : (
            <Row gutter={[16, 32]} justify='center' align='middle'>
               {rooms?.map((room) => (
                  <Col span={6} key={room.id}>
                     <Card
                        bordered={false}
                        onClick={() => setSelectedRoomId(room.id)}
                        className={alarms.find((item) => item.roomId === room.id) ? "alarm-card" : ""}
                     >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                           <div>
                              <h3>{room.name}</h3>
                           </div>
                           <div style={{ display: "flex", alignItems: "center" }}>
                              <Tag color={getTagInfo(room).color}>{getTagInfo(room).text}</Tag> {/* Use getTagInfo */}
                              {alarms.find((item) => item.roomId === room.id) && (
                                 <BellOutlined style={{ color: "red", marginRight: "8px", fontSize: 24 }} />
                              )}{" "}
                           </div>
                        </div>
                        <div
                           style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginTop: 16,
                           }}
                        >
                           <div>
                              <Typography.Title level={4} style={{ margin: 0 }}>
                                 {room.personnel_name
                                    ? // Display personnel name (masked) if personnel_id exists
                                      room.personnel_name.charAt(0) + "*".repeat(room.personnel_name.length - 1 || 0)
                                    : ""}
                              </Typography.Title>
                           </div>
                           <div style={{ display: "flex", flexDirection: "column" }}>
                              {/* Add flexDirection: "column" */}
                              <Button type='link' style={{ padding: 0 }}>
                                 日曲线
                              </Button>
                              <Button type='link' style={{ padding: 0 }}>
                                 周曲线
                              </Button>
                           </div>
                        </div>
                        <Row gutter={16} style={{ marginTop: 16 }}>
                           <Col span={8}>
                              {" "}
                              {/* Each Col takes 1/3 of the row (24 / 3 = 8) */}
                              <div style={{ textAlign: "center" }}>
                                 <HeartOutlined style={{ fontSize: 27, color: "red" }} />
                                 <p style={{ fontSize: 16, fontWeight: "bold", margin: 0 }}>{room.heartRate} 次</p>
                              </div>
                           </Col>
                           <Col span={8}>
                              <div style={{ textAlign: "center" }}>
                                 <img
                                    src={"/images/ll.png"}
                                    alt='Breath Rate Icon'
                                    style={{ width: 24, height: 24, color: "blue" }}
                                 />
                                 <p style={{ fontSize: 16, fontWeight: "bold", margin: 0 }}>{room.breathRate} 次</p>
                              </div>
                           </Col>
                           <Col span={8}>
                              <div style={{ textAlign: "center" }}>
                                 <img
                                    src={"/images/radar2.png"}
                                    alt='Radar Icon'
                                    style={{ width: 24, height: 24, color: "blue" }}
                                 />
                                 <p style={{ fontSize: 16, fontWeight: "bold", margin: 0 }}>{room.distance} 米</p>
                              </div>
                           </Col>
                        </Row>
                     </Card>
                  </Col>
               ))}
            </Row>
         )}
         {selectedRoomId && (
            <Button
               type='primary'
               style={{ position: "absolute", top: 100, right: 20 }}
               onClick={() => setSelectedRoomId(null)}
            >
               返回总览
            </Button>
         )}
      </div>
   );
};

export default Overview;
