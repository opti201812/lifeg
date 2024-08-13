import React from "react";
import { Button } from "antd";
import dayjs from "dayjs";

interface RoomInfoFootProps {
   lastUpdate: string;
   onDisarmClick: () => void;
}

const RoomInfoFoot: React.FC<RoomInfoFootProps> = ({ lastUpdate, onDisarmClick }) => {
   return (
      <div
         style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
         }}
      >
         <div
            style={{
               display: "flex",
               justifyContent: "center",
               alignItems: "center",
               flex: 1,
            }}
         >
            <Button
               type='primary'
               danger
               size='middle'
               onClick={onDisarmClick}
               style={{ marginTop: 4, marginLeft: 160, width: 120 }}
            >
               撤防
            </Button>
         </div>
         <p style={{ textAlign: "right", fontSize: "12px", color: "#999" }}>
            数据更新于: {dayjs(lastUpdate).format("YYYY-MM-DD HH:mm:ss")}
         </p>
      </div>
   );
};

export default RoomInfoFoot;
