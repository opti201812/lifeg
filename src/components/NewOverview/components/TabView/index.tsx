import React from "react";
import { Tabs, Row } from "antd";
import { RoomPersonnel, Room } from "../../types";
import PersonnelCard from "../PersonnelCard";
import AddPersonnelCard from "../AddPersonnelCard";
import PersonnelTable from "../PersonnelTable";
import AlarmTable from "../AlarmTable";
import config from "../../../../config";

interface TabViewProps {
   activeTab: string;
   onTabChange: (key: string) => void;
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

const TabView: React.FC<TabViewProps> = ({
   activeTab,
   onTabChange,
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

   // 定义选项卡内容
   const tabItems = [
      {
         key: "card",
         label: "卡片视图",
         children: renderCardView(),
      },
      {
         key: "list",
         label: "列表视图",
         children: (
            <PersonnelTable
               dataSource={allRoomPersonnel}
               loading={loading}
               onViewDetails={onViewDetails}
               onAddPersonnel={onAddPersonnel}
            />
         ),
      },
      // 只有在配置为table模式时才显示"实时报警"选项卡
      ...(config.alarm.displayMode === "table"
         ? [
              {
                 key: "alarms",
                 label: "实时报警",
                 children: <AlarmTable alarms={alarms} rooms={rooms} loading={loading} />,
              },
           ]
         : []),
   ];

   return <Tabs activeKey={activeTab} onChange={onTabChange} items={tabItems} />;
};

export default React.memo(TabView);
