import React from "react";
import { Row, Col, Spin } from "antd";
import { RoomPersonnel, Room } from "../../types";
import PersonnelCard from "../PersonnelCard";
import AddPersonnelCard from "../AddPersonnelCard";
import chartConfig from "../../../../config/chartConfig";

interface CardViewProps {
   allRoomPersonnel: (RoomPersonnel & { deviceInfo?: any; braceletStatus?: string; sortType?: number })[];
   showPersonnelName: boolean;
   alarms: any[];
   associations: any[];
   roomTypes: any[];
   roomTemplates: any[];
   rooms: Room[];
   loading: boolean;
   onCardClick: (roomPersonnel: RoomPersonnel) => void;
   onDayCurveClick: (roomPersonnel: RoomPersonnel, event: React.MouseEvent) => void;
   onWeekCurveClick: (roomPersonnel: RoomPersonnel, event: React.MouseEvent) => void;
   onAddPersonnel: (roomId: number) => void;
   onViewDetails: (record: RoomPersonnel) => void;
}

const CardView: React.FC<CardViewProps> = ({
   allRoomPersonnel,
   showPersonnelName,
   alarms,
   associations,
   roomTypes,
   roomTemplates,
   onCardClick,
   onDayCurveClick,
   onWeekCurveClick,
   onAddPersonnel,
   loading,
}) => {
   if (loading) {
      return (
         <div style={{ textAlign: "center", padding: "50px" }}>
            <Spin size='large' />
         </div>
      );
   }

   return (
      <Row gutter={[16, 16]} style={{ alignItems: "center" }}>
         {allRoomPersonnel.map((roomPersonnel) => {
            if (roomPersonnel.personnel) {
               return (
                  <PersonnelCard
                     key={`personnel-${roomPersonnel.associationId}`}
                     roomPersonnel={roomPersonnel}
                     showPersonnelName={showPersonnelName}
                     alarms={alarms}
                     onCardClick={() => onCardClick(roomPersonnel)}
                     onDayCurveClick={(event) => onDayCurveClick(roomPersonnel, event)}
                     onWeekCurveClick={(event) => onWeekCurveClick(roomPersonnel, event)}
                  />
               );
            } else {
               // 空白卡片（设防功能）
               return (
                  <Col span={chartConfig.cardGridSpan} key={`add-${roomPersonnel.room.id}`}>
                     <AddPersonnelCard
                        room={roomPersonnel.room}
                        associations={associations}
                        roomTypes={roomTypes}
                        roomTemplates={roomTemplates}
                        onAddClick={onAddPersonnel}
                     />
                  </Col>
               );
            }
         })}
      </Row>
   );
};

// 🔥 关键修复：移除 React.memo 或使用自定义比较函数，确保数据更新时重新渲染
export default CardView;
