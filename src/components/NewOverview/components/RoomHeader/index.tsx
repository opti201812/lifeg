import React from "react";
import { Button } from "antd";
import { Room } from "../../types";

interface RoomHeaderProps {
   currentRoom: Room | null;
   selectedRoom: any;
   onBackToOverview: () => void;
}

const RoomHeader: React.FC<RoomHeaderProps> = ({ currentRoom, selectedRoom, onBackToOverview }) => {
   return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
         <h2>{currentRoom ? `${currentRoom.name} 人员` : "人员总览"}</h2>

         {selectedRoom && (
            <Button type='primary' style={{ width: 120, fontSize: 16 }} onClick={onBackToOverview}>
               返回人员总览
            </Button>
         )}
      </div>
   );
};

export default React.memo(RoomHeader);
