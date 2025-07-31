import React, { useState } from "react";
import { Tabs, Row } from "antd";
import { RoomPersonnel, Room } from "../../../NewOverview/types";
import PersonnelCard from "../../../NewOverview/components/PersonnelCard";
import AddPersonnelCard from "../../../NewOverview/components/AddPersonnelCard";

interface CurveViewProps {
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

const CurveView: React.FC<CurveViewProps> = ({
   allRoomPersonnel,
   showPersonnelName,
   alarms,
   associations,
   roomTypes,
   roomTemplates,
   rooms,
   loading,
   onCardClick,
   onDayCurveClick,
   onWeekCurveClick,
   onAddPersonnel,
   onViewDetails,
}) => {
   const [activeSubTab, setActiveSubTab] = useState<string>("basic");

   // 渲染卡片视图
   const renderCardView = () => (
      <Row gutter={[16, 32]} justify='center' align='middle'>
         {allRoomPersonnel.map((roomPersonnel) => {
            // 如果没有人员，渲染添加卡片
            if (!roomPersonnel.personnel) {
               return (
                  <AddPersonnelCard
                     key={`${roomPersonnel.room.id}-add`}
                     room={roomPersonnel.room}
                     associations={associations}
                     roomTypes={roomTypes}
                     roomTemplates={roomTemplates}
                     onAddClick={onAddPersonnel}
                  />
               );
            }

            // 渲染人员卡片
            return (
               <PersonnelCard
                  key={`${roomPersonnel.room.id}-${roomPersonnel.personnel.id}`}
                  roomPersonnel={roomPersonnel}
                  showPersonnelName={showPersonnelName}
                  alarms={alarms}
                  onCardClick={() => onCardClick(roomPersonnel)}
                  onDayCurveClick={(event) => onDayCurveClick(roomPersonnel, event)}
                  onWeekCurveClick={(event) => onWeekCurveClick(roomPersonnel, event)}
               />
            );
         })}
      </Row>
   );

   // 定义子选项卡内容
   const subTabItems = [
      {
         key: "basic",
         label: "基础体征",
         children: (
            <div>
               <p>基础体征曲线功能正在开发中...</p>
               {/* TODO: 实现基础体征曲线组件 */}
               {renderCardView()}
            </div>
         ),
      },
      {
         key: "analysis",
         label: "体征分析",
         children: (
            <div>
               <p>体征分析功能正在开发中...</p>
               {/* TODO: 实现体征分析组件 */}
               {renderCardView()}
            </div>
         ),
      },
      {
         key: "evaluation",
         label: "综合评测",
         children: (
            <div>
               <p>综合评测功能正在开发中...</p>
               {/* TODO: 实现综合评测组件 */}
               {renderCardView()}
            </div>
         ),
      },
   ];

   return (
      <div>
         <Tabs
            activeKey={activeSubTab}
            onChange={setActiveSubTab}
            items={subTabItems}
            tabBarStyle={{ marginBottom: 16 }}
         />
      </div>
   );
};

export default CurveView;
