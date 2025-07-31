import React from "react";
import { Tabs } from "antd";
import { RoomPersonnel, Room } from "../../../NewOverview/types";
import CurveView from "../CurveView";
import ReportView from "../ReportView";
import AlarmView from "../AlarmView";

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
   // 定义选项卡内容
   const tabItems = [
      {
         key: "curve",
         label: "曲线",
         children: (
            <CurveView
               allRoomPersonnel={allRoomPersonnel}
               showPersonnelName={showPersonnelName}
               alarms={alarms}
               associations={associations}
               roomTypes={roomTypes}
               roomTemplates={roomTemplates}
               rooms={rooms}
               loading={loading}
               onCardClick={onCardClick}
               onDayCurveClick={onDayCurveClick}
               onWeekCurveClick={onWeekCurveClick}
               onAddPersonnel={onAddPersonnel}
               onViewDetails={onViewDetails}
            />
         ),
      },
      {
         key: "report",
         label: "报表",
         children: (
            <ReportView
               allRoomPersonnel={allRoomPersonnel}
               showPersonnelName={showPersonnelName}
               alarms={alarms}
               associations={associations}
               roomTypes={roomTypes}
               roomTemplates={roomTemplates}
               rooms={rooms}
               loading={loading}
               onCardClick={onCardClick}
               onDayCurveClick={onDayCurveClick}
               onWeekCurveClick={onWeekCurveClick}
               onAddPersonnel={onAddPersonnel}
               onViewDetails={onViewDetails}
            />
         ),
      },
      {
         key: "alarm",
         label: "报警",
         children: <AlarmView alarms={alarms} rooms={rooms} loading={loading} />,
      },
   ];

   return <Tabs activeKey={activeTab} onChange={onTabChange} items={tabItems} />;
};

export default React.memo(TabView);
