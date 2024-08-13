import React, { useState, useEffect, useRef } from "react";
import { Card, Row, Col, Button, Tag, Typography, message } from "antd";
import { HeartOutlined, BellOutlined } from "@ant-design/icons";
import "./Overview.css";
import RoomPage from "../../pages/Room";
import { useSelector } from "react-redux";
import { MEDICAL_HISTORIES, Room, User } from "../../types";
import axios from "axios";
import config from "../../config";

const Overview: React.FC = () => {
   const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
   const [rooms, setRooms] = useState<Room[]>([]);
   const user = useSelector((state: { user: User }) => state.user);

   useEffect(() => {
      // Fetch room data from API
      const fetchRooms = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/rooms`);
            const roomsData = response.data.map((room: Room) => ({
               ...room,
               enabled: (room.enabled as unknown) === 1,
            }));
            setRooms(roomsData || []);
         } catch (error) {
            console.error("Error fetching rooms:", error);
            message.error("Failed to load rooms");
         }
      };
      fetchRooms();
   }, []);

   // WebSocket connection for real-time data
   useEffect(() => {
      let ws: WebSocket | null = null;

      const connectToWebSocket = () => {
         // ws = new WebSocket(`ws://${config.backend.url.replace("http://", "")}`); // Replace http:// with ws://
         ws = new WebSocket(`ws://localhost:3030`); // Replace http:// with ws://

         ws.onopen = () => {
            console.log("Connected to WebSocket server");

            // Wait for the connection to be fully open (readyState === 1)
            const waitForOpenConnection = setInterval(() => {
               console.log("Waiting for WebSocket connection to be open...");
               if (ws?.readyState === WebSocket.OPEN) {
                  console.log("WebSocket connection is open.");
                  clearInterval(waitForOpenConnection);

                  // Subscribe to all rooms or specific rooms based on user role
                  if (user.role === "admin") {
                     ws?.send(JSON.stringify({ type: "subscribe", topic: "/rooms/all" }));
                  } else if (user.role === "user" && user.room_id) {
                     ws?.send(JSON.stringify({ type: "subscribe", topic: `/rooms/${user.room_id}` }));
                  } else {
                     console.log("no role");
                  }

                  // 设置 ws.onmessage 处理所有消息类型
                  ws.onmessage = (event) => {
                     const data = JSON.parse(event.data);

                     if (data.type === "subscribe") {
                        // 处理订阅响应
                        if (data.success) {
                           console.info(`Subscribed to ${data.topic}`);
                        } else {
                           console.error(`Failed to subscribe to ${data.topic}: ${data.error}`);
                        }
                     } else if (data.type === "roomData") {
                        // 处理其他类型的消息
                        // ... 根据 data.type 执行相应的操作
                        const roomData = data.data;
                        setRooms((prevRooms) =>
                           prevRooms?.map((room) => (room.id === data.roomId ? { ...room, ...roomData } : room))
                        );
                     } else if (data.type === "alertMessage") {
                        // 处理其他类型的消息
                        // ... 根据 data.type 执行相应的操作
                        console.log("alertMessage:", data);
                        data.medicalHistoryCode !== "d00" &&
                           console.log(
                              "History:",
                              MEDICAL_HISTORIES.find((item) => item.value === data.medicalHistoryCode)?.label
                           );
                        // setRooms((prevRooms) =>
                        // prevRooms?.map((room) => (room.id === data.roomId ? { ...room, ...data } : room))
                        // );
                     }
                  };
               }
            }, 100);
         };

         ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // Update the corresponding room's data in the `rooms` state
            setRooms((prevRooms) => prevRooms?.map((room) => (room.id === data.roomId ? { ...room, ...data } : room)));
         };

         ws.onclose = () => {
            console.log("Disconnected from WebSocket server");
            // Attempt to reconnect after a delay (optional)
            setTimeout(connectToWebSocket, 5000); // Reconnect after 5 seconds
         };

         ws.onerror = (error) => {
            console.error("WebSocket error:", error);
         };
      };

      console.log("Connecting to WebSocket server");
      connectToWebSocket();

      // Cleanup function to close the WebSocket connection
      return () => {
         if (ws) {
            ws.close();
         }
      };
   }, [user.role, user.room_id]);

   const getCollectionStatus = (room: Room) => {
      switch (room.enabled) {
         case false:
            return { text: "未采集", color: "red" };
         case true:
            return { text: "采集中", color: "green" };
         default:
            return { text: "故障", color: "gray" };
      }
   };

   return (
      <div>
         <h2>总览</h2>
         {selectedRoomId ? (
            <RoomPage roomId={selectedRoomId} gender='' age={0} />
         ) : (
            <Row gutter={[16, 32]}>
               {rooms?.map((room) => (
                  <Col span={6} key={room.id}>
                     <Card
                        bordered={false}
                        onClick={() => setSelectedRoomId(room.id)}
                        className={room.alarm ? "alarm-card" : ""}
                     >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                           <div>
                              <h3>{room.name}</h3>
                           </div>
                           <div style={{ display: "flex", alignItems: "center" }}>
                              <Tag color={getCollectionStatus(room).color}>{getCollectionStatus(room).text}</Tag>
                              {room.alarm && (
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
                                 {room.name.charAt(0) + "*".repeat(room.name.length - 1)}{" "}
                                 {/* Display first character and mask the rest */}
                              </Typography.Title>
                           </div>
                           <div style={{ display: "flex", flexDirection: "column" }}>
                              {" "}
                              {/* Add flexDirection: "column" */}
                              <Button type='link' style={{ padding: 0 }}>
                                 一日曲线
                              </Button>
                              <Button type='link' style={{ padding: 0 }}>
                                 一周曲线
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
