import React, { useState, useEffect } from "react";
import { Card, Row, Col } from "antd";
import "./Overview.css";

interface Room {
   id: number;
   name: string;
   heartRate: number;
   breathRate: number;
   distance: number;
   alarm: boolean;
}

const Overview: React.FC = () => {
   const [rooms, setRooms] = useState<Room[]>([
      { id: 1, name: "Room 1", heartRate: 82, breathRate: 22, distance: 1.2, alarm: false },
      { id: 2, name: "Room 2", heartRate: 92, breathRate: 28, distance: 1.2, alarm: true },
      { id: 3, name: "Room 3", heartRate: 75, breathRate: 20, distance: 1.2, alarm: false },
      { id: 4, name: "Room 4", heartRate: 88, breathRate: 24, distance: 1.2, alarm: false },
   ]);

   useEffect(() => {
      const interval = setInterval(() => {
         setRooms((prevRooms) =>
            prevRooms.map((room) => ({
               ...room,
               alarm: room.alarm ? !room.alarm : room.alarm,
            }))
         );
      }, 1000);

      return () => clearInterval(interval);
   }, []);

   return (
      <div>
         <h2>总览</h2>
         <Row gutter={16}>
            {rooms.map((room) => (
               <Col span={6} key={room.id}>
                  <Card title={room.name} className={room.alarm ? "alarm-card" : ""} bordered={false}>
                     <p>心率: {room.heartRate}</p>
                     <p>呼吸: {room.breathRate}</p>
                     <p>距离: {room.distance} 米</p>
                     {room.alarm && <p className='alarm-text'>紧急中</p>}
                  </Card>
               </Col>
            ))}
         </Row>
      </div>
   );
};

export default Overview;
