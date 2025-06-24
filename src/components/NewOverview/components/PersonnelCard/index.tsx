import React from "react";
import { Card, Row, Col, Tag, Button } from "antd";
import { HeartOutlined, BellOutlined } from "@ant-design/icons";
import { RoomPersonnel } from "../../types";
import { getTagInfo, getIcon } from "../../utils/roomHelpers";

interface PersonnelCardProps {
   roomPersonnel: RoomPersonnel & {
      deviceInfo?: any;
      braceletStatus?: string;
   };
   showPersonnelName: boolean;
   alarms: any[];
   onCardClick: () => void;
   onDayCurveClick: (event: React.MouseEvent) => void;
   onWeekCurveClick: (event: React.MouseEvent) => void;
}

const PersonnelCard: React.FC<PersonnelCardProps> = ({
   roomPersonnel,
   showPersonnelName,
   alarms,
   onCardClick,
   onDayCurveClick,
   onWeekCurveClick,
}) => {
   const { room, personnel, deviceInfo } = roomPersonnel;

   if (!personnel || !deviceInfo) {
      return null;
   }

   const { heartRate, breathRate, distance, environmentInterference, roomAndRadarData } = deviceInfo;

   // 对待分配房间进行特殊处理
   const isUnassigned = room.id === -1;
   const roomName = isUnassigned ? "待分配房间" : room.name;

   return (
      <Col span={6} key={`${room.id}-${personnel.id}`}>
         <Card
            bordered={false}
            onClick={onCardClick}
            className={alarms.find((item) => item.personnelId == personnel.id) ? "alarm-card" : ""}
         >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <div>
                  <h3 style={isUnassigned ? { color: "#999" } : {}}>{roomName}</h3>
                  <div style={{ fontSize: "12px", color: "#888" }}>{showPersonnelName ? personnel.name : ""}</div>
               </div>
               <div style={{ display: "flex", alignItems: "center" }}>
                  <Tag color={getTagInfo(room).color} key={`tag-${room.id}`}>
                     {getTagInfo(room).text}
                  </Tag>
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
                  <Col span={4}>{getIcon(roomAndRadarData)}</Col>
               </Row>
               <div style={{ display: "flex", flexDirection: "column" }}>
                  <Button type='link' style={{ padding: 0 }} onClick={onDayCurveClick}>
                     日曲线
                  </Button>
                  <Button type='link' style={{ padding: 0 }} onClick={onWeekCurveClick}>
                     周曲线
                  </Button>
               </div>
            </div>
            <Row gutter={16} style={{ marginTop: 16 }}>
               <Col span={6}>
                  <div style={{ textAlign: "center" }}>
                     <HeartOutlined style={{ fontSize: 27, color: "red" }} />
                     <p style={{ fontSize: 12, fontWeight: "bold", margin: 0 }}>{heartRate} 次</p>
                  </div>
               </Col>
               <Col span={6}>
                  <div style={{ textAlign: "center" }}>
                     <img src={"/images/ll.png"} alt='呼吸率图标' style={{ width: 24, height: 24, color: "blue" }} />
                     <p style={{ fontSize: 12, fontWeight: "bold", margin: 0 }}>{breathRate} 次</p>
                  </div>
               </Col>
               <Col span={6}>
                  <div style={{ textAlign: "center" }}>
                     <img src={"/images/radar2.png"} alt='雷达图标' style={{ width: 24, height: 24, color: "blue" }} />
                     <p style={{ fontSize: 12, fontWeight: "bold", margin: 0 }}>
                        {distance === "-" ? "-" : (distance / 100).toFixed(2) + "米"}
                     </p>
                  </div>
               </Col>
               <Col span={6}>
                  <div style={{ textAlign: "center" }}>
                     <img
                        src={"/images/radarzzz.png"}
                        alt='干扰图标'
                        style={{ width: 24, height: 24, color: "orange" }}
                     />
                     <p style={{ fontSize: 12, fontWeight: "bold", margin: 0 }}>{environmentInterference}</p>
                  </div>
               </Col>
            </Row>
            <Row style={{ marginTop: 16 }}>
               <Col span={24} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 12, fontWeight: "bold", margin: 0 }}>{roomPersonnel.braceletStatus}</p>
               </Col>
            </Row>
         </Card>
      </Col>
   );
};

export default React.memo(PersonnelCard);
