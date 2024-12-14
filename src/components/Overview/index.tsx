// components/Overview/index.tsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, Row, Col, Button, Tag, Typography, message } from "antd";
import { HeartOutlined, BellOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "./Overview.css";
import RoomPage from "../../pages/Room";
import { useDispatch, useSelector } from "react-redux";
import { AlertConfig, MEDICAL_HISTORIES, Room, User } from "../../types";
import { RootState } from "../../store";
import { FaBed, FaChair, FaWalking } from "react-icons/fa"; // 使用react-icons库
import axios from "axios";
import config from "../../config";
import { setRooms } from "../../store/dataSlice";

const Overview: React.FC = () => {
   const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
   const [showPersonnelName, setShowPersonnelName] = useState(false);
   const rooms = useSelector((state: RootState) => state.data.rooms); // Get rooms from Redux store
   const alarms = useSelector((state: RootState) => state.data.alarms); // Get alarms from Redux store
   const dispatch = useDispatch();

   useEffect(() => {
      // Fetch SMS config on component mount
      axios
         .get(`${config.backend.url}/smsconfig`)
         .then((res) => {
            const isPersonNameVisibleConfig = res.data.find(
               (config: AlertConfig) => config.config_name === "isPersonNameVisible"
            );
            setShowPersonnelName(
               isPersonNameVisibleConfig?.value === "true" || isPersonNameVisibleConfig?.value === true
            ); // Show if enabled
         })
         .catch((err) => {
            console.error("Error fetching SMS config:", err);
         });
      const fetchRooms = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/rooms`);
            const roomsData = response.data.map((room: Room) => ({
               ...room,
               enabled: room.enabled,
            }));
            dispatch(setRooms(roomsData || [])); // Dispatch the setRooms action
         } catch (error) {
            console.error("Error fetching rooms:", error);
            message.error("获取房间信息失败！");
         }
      };

      if (!selectedRoomId) fetchRooms();
   }, [selectedRoomId]);

   // 增加useeffect，当alarms变化时，对rooms进行排序，当前处于报警状态的room排序在最前面
   useEffect(() => {
      const sortedRooms = [...rooms].sort((a, b) => {
         const aHasAlarm = alarms.some((alarm) => alarm.roomId === a.id);
         const bHasAlarm = alarms.some((alarm) => alarm.roomId === b.id);
         if (aHasAlarm && !bHasAlarm) return -1; // a排在前面
         if (!aHasAlarm && bHasAlarm) return 1; // b排在前面
         return 0; // 顺序不变
      });
      dispatch(setRooms(sortedRooms));
   }, [alarms]);

   // Function to check if current time is within restricted schedule
   const isInRestrictedSchedule = useCallback((room: Room) => {
      if (!room.personnel_id || !room.schedules || room.schedules.length === 0) {
         return false; // No personnel or schedules, not restricted
      }

      const now = dayjs();
      const currentYear = now.year();
      const currentMonth = now.month() + 1; // Months are 0-based
      const currentDay = now.date();
      const currentHour = now.hour();
      const currentMinute = now.minute();

      const currentDateTime = dayjs(new Date(currentYear, currentMonth - 1, currentDay, currentHour, currentMinute));

      for (const schedule of room.schedules) {
         const daysOfWeek = JSON.parse(schedule.days_of_week);

         for (const dateRange of daysOfWeek) {
            const [startDate, endDate] = dateRange.map((date: string) => dayjs(date, "YYYY-MM-DD"));
            let date = startDate;

            while (date.isBefore(endDate) || date.isSame(endDate, "day")) {
               const [startHour, startMinute] = schedule.start_time.split(":").map(Number);
               const [endHour, endMinute] = schedule.end_time.split(":").map(Number);

               let startDateTime = date.hour(startHour).minute(startMinute);
               let endDateTime = date.hour(endHour).minute(endMinute);

               // Handle cross-day schedules
               if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
                  endDateTime = endDateTime.add(1, "day"); // Move end time to the next day
               }

               if (currentDateTime.isAfter(startDateTime) && currentDateTime.isBefore(endDateTime)) {
                  return true; // Within restricted time
               }

               date = date.add(1, "day"); // Move to the next day
            }
         }
      }

      return false; // Not within any restricted schedule
   }, []);

   const getTagInfo = useCallback(
      (room: Room) => {
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
      },
      [isInRestrictedSchedule]
   );

   const getIcon = useCallback((room: Room) => {
      const iconSize = 24;
      if (!room.enabled) return null;
      if (room.person_pose === "坐姿" || !room.mattress_distance) return <FaChair color='orange' />;

      const distanceValue = room.mattress_distance - (room.distance ? room.distance * 100 : 0);

      if (distanceValue === 0 || room.distance === undefined) {
         return <FaWalking color='red' style={{ fontSize: iconSize + "px" }} />; // 离开图标
      } else if (distanceValue < 30) {
         return <FaBed color='green' style={{ fontSize: iconSize + "px" }} />; // 卧床图标
      } else if (distanceValue < 70) {
         return <FaChair color='orange' style={{ fontSize: iconSize + "px" }} />; // 坐姿图标
      } else {
         return <FaWalking color='red' style={{ fontSize: iconSize + "px" }} />; // 离开图标
      }
   }, []);

   return (
      <div>
         <h2>总览</h2>
         {selectedRoomId ? (
            <RoomPage roomId={selectedRoomId} />
         ) : (
            <Row gutter={[16, 32]} justify='center' align='middle'>
               {rooms?.map((room) => (
                  <Col span={6} key={room.id}>
                     <Card
                        bordered={false}
                        onClick={() => setSelectedRoomId(room.id)}
                        className={alarms.find((item) => item.roomId === room.id && item.level < 3) ? "alarm-card" : ""}
                     >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                           <div>
                              <h3>{room.name}</h3>
                           </div>
                           <div style={{ display: "flex", alignItems: "center" }}>
                              <Tag color={getTagInfo(room).color}>{getTagInfo(room).text}</Tag>
                              {alarms.find((item) => item.roomId === room.id) && (
                                 <BellOutlined style={{ color: "red", marginRight: "8px", fontSize: 24 }} />
                              )}
                           </div>
                        </div>
                        <div
                           style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginTop: 8,
                           }}
                        >
                           <Row style={{ width: "100%" }}>
                              <Col span={4}>{getIcon(room)}</Col>
                              <Col span={20}>
                                 {showPersonnelName && (
                                    <Typography.Title level={4} style={{ margin: 0 }}>
                                       {room.personnelName
                                          ? room.personnelName.toString().charAt(0) +
                                            "*".repeat(room.personnelName.length - 1 || 0)
                                          : ""}
                                    </Typography.Title>
                                 )}
                              </Col>
                           </Row>
                           <div style={{ display: "flex", flexDirection: "column" }}>
                              <Button type='link' style={{ padding: 0 }}>
                                 日曲线
                              </Button>
                              <Button type='link' style={{ padding: 0 }}>
                                 周曲线
                              </Button>
                           </div>
                        </div>
                        <Row gutter={16} style={{ marginTop: 16 }}>
                           <Col span={6}>
                              <div style={{ textAlign: "center" }}>
                                 <HeartOutlined style={{ fontSize: 27, color: "red" }} />
                                 <p style={{ fontSize: 12, fontWeight: "bold", margin: 0 }}>
                                    {room.environment ? room.heartRate : "-"} 次
                                 </p>
                              </div>
                           </Col>
                           <Col span={6}>
                              <div style={{ textAlign: "center" }}>
                                 <img
                                    src={"/images/ll.png"}
                                    alt='Breath Rate Icon'
                                    style={{ width: 24, height: 24, color: "blue" }}
                                 />
                                 <p style={{ fontSize: 12, fontWeight: "bold", margin: 0 }}>
                                    {room.environment ? room.breathRate : "-"} 次
                                 </p>
                              </div>
                           </Col>
                           <Col span={6}>
                              <div style={{ textAlign: "center" }}>
                                 <img
                                    src={"/images/radar2.png"}
                                    alt='Radar Icon'
                                    style={{ width: 24, height: 24, color: "blue" }}
                                 />
                                 <p style={{ fontSize: 12, fontWeight: "bold", margin: 0 }}>
                                    {room.environment ? room.distance : "-"}米
                                 </p>
                              </div>
                           </Col>
                           <Col span={6}>
                              <div style={{ textAlign: "center" }}>
                                 <img
                                    src={"/images/radarzzz.png"}
                                    alt='Disturbance Icon'
                                    style={{ width: 24, height: 24, color: "orange" }}
                                 />
                                 <p style={{ fontSize: 12, fontWeight: "bold", margin: 0 }}>
                                    {room.environment || "-"}
                                 </p>
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
