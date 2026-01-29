import React, { useState, useEffect } from "react";
import { Card, Row, Col, Tag, Button } from "antd";
import { HeartOutlined, BellOutlined, FireOutlined } from "@ant-design/icons";
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

   // 存储手环数据的状态，包含数据和时间戳
   const [braceletDataState, setBraceletDataState] = useState<{
      data: any;
      timestamp: number;
   } | null>(null);

   if (!personnel || !deviceInfo) {
      return null;
   }

   const { heartRate: radarHeartRate, breathRate, distance, roomAndRadarData } = deviceInfo;
   const currentBraceletData = deviceInfo.braceletData;

   // 处理手环数据更新逻辑
   useEffect(() => {
      if (currentBraceletData !== null && currentBraceletData !== undefined) {
         // 如果有新的有效手环数据，更新状态
         setBraceletDataState({
            data: currentBraceletData,
            timestamp: Date.now(),
         });
      }
   }, [currentBraceletData]);

   // 初始化状态（组件首次渲染时如果有数据则保存）
   useEffect(() => {
      if (currentBraceletData !== null && currentBraceletData !== undefined && !braceletDataState) {
         setBraceletDataState({
            data: currentBraceletData,
            timestamp: Date.now(),
         });
      }
   }, []);

   // 获取当前要显示的手环数据
   const getDisplayBraceletData = () => {
      // 如果当前有有效的手环数据，直接使用
      if (currentBraceletData !== null && currentBraceletData !== undefined) {
         return currentBraceletData;
      }

      // 如果当前数据为null，检查是否有缓存的数据
      if (currentBraceletData === null && braceletDataState && braceletDataState.data) {
         const now = Date.now();
         const timeDiff = now - braceletDataState.timestamp;

         // 如果缓存数据不超过30秒，继续使用
         if (timeDiff <= 30000) {
            return braceletDataState.data;
         }
      }

      return null;
   };

   const displayBraceletData = getDisplayBraceletData();

   // 获取心率：优先使用手环心率，其次使用雷达心率
   const getDisplayHeartRate = () => {
      // 如果手环数据存在且有心率数据，优先使用手环心率
      if (
         displayBraceletData &&
         displayBraceletData.heartRate !== undefined &&
         displayBraceletData.heartRate !== null
      ) {
         return displayBraceletData.heartRate;
      }

      // 否则使用雷达心率
      return radarHeartRate;
   };

   const displayHeartRate = getDisplayHeartRate();

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
            {/* 第一行：心率、血压、血氧 */}
            <Row gutter={8} style={{ marginTop: 16 }}>
               <Col span={7}>
                  <div style={{ textAlign: "center" }}>
                     <HeartOutlined style={{ fontSize: 28, color: "#ff4d4f" }} />
                     <p style={{ fontSize: 14, fontWeight: "bold", margin: "4px 0 0 0" }}>{displayHeartRate} 次</p>
                  </div>
               </Col>
               <Col span={10}>
                  <div style={{ textAlign: "center" }}>
                     <span style={{ fontSize: 23, color: "#722ed1" }}>🩸</span>
                     <p style={{ fontSize: 14, fontWeight: "bold", margin: "2px 0 0 0", lineHeight: 1.2 }}>
                        {displayBraceletData?.systolicPressure && displayBraceletData?.diastolicPressure
                           ? `${displayBraceletData.diastolicPressure}/${displayBraceletData.systolicPressure}`
                           : "-"}
                        <span style={{ fontSize: 10 }}> mmHg</span>
                     </p>
                  </div>
               </Col>
               <Col span={7}>
                  <div style={{ textAlign: "center" }}>
                     <FireOutlined style={{ fontSize: 28, color: "#52c41a" }} />
                     <p style={{ fontSize: 14, fontWeight: "bold", margin: "2px 0 0 0" }}>
                        {displayBraceletData?.bloodOxygen || "-"}%
                     </p>
                  </div>
               </Col>
            </Row>

            {/* 第二行：呼吸、体温、距离 */}
            <Row gutter={8} style={{ marginTop: 12 }}>
               <Col span={7}>
                  <div style={{ textAlign: "center" }}>
                     <img src={"/images/ll.png"} alt='呼吸率图标' style={{ width: 28, height: 28 }} />
                     <p style={{ fontSize: 14, fontWeight: "bold", margin: "2px 0 0 0" }}>{breathRate} 次</p>
                  </div>
               </Col>
               <Col span={10}>
                  <div style={{ textAlign: "center" }}>
                     <span style={{ fontSize: 23, color: "#fa8c16" }}>🌡️</span>
                     <p style={{ fontSize: 14, fontWeight: "bold", margin: "2px 0 0 0" }}>
                        {displayBraceletData?.bodyTemperature || "-"}°C
                     </p>
                  </div>
               </Col>
               <Col span={7}>
                  <div style={{ textAlign: "center" }}>
                     <img src={"/images/radar2.png"} alt='雷达图标' style={{ width: 28, height: 28 }} />
                     <p style={{ fontSize: 14, fontWeight: "bold", margin: "2px 0 0 0" }}>
                        {distance === "-" ? "-" : (distance / 100).toFixed(2) + "米"}
                     </p>
                  </div>
               </Col>
            </Row>
             <Row style={{ marginTop: 16 }}>
                <Col span={24} style={{ textAlign: "center" }}>
                   <p style={{ fontSize: 12, fontWeight: "bold", margin: 0, whiteSpace: "pre-line" }}>
                      {roomPersonnel.braceletStatus}
                   </p>
                </Col>
             </Row>
         </Card>
      </Col>
   );
};

export default React.memo(PersonnelCard);
