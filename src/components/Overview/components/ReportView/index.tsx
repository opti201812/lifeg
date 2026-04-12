import React from "react";
import { RoomPersonnel, Room } from "../../types";
import PersonnelTable from "../PersonnelTable/index";

interface ReportViewProps {
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

const ReportView: React.FC<ReportViewProps> = ({ allRoomPersonnel, loading, onViewDetails, onAddPersonnel }) => {
   return (
      <PersonnelTable
         dataSource={allRoomPersonnel}
         loading={loading}
         onViewDetails={onViewDetails}
         onAddPersonnel={onAddPersonnel}
      />
   );
};

export default React.memo(ReportView);
