import React from "react";
import { Button } from "antd";
import dayjs from "dayjs";

interface RoomInfoFootProps {
   lastUpdate: string;
   pose: string;
   // onDisarmClick 可以是函数或者不包含该参数
   onDisarmClick?: () => void;
}

const RoomInfoFoot: React.FC<RoomInfoFootProps> = ({ lastUpdate, onDisarmClick, pose }) => {
   return (
      <div
         style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
         }}
      >
         <p style={{ textAlign: "left", fontSize: "12px", color: "#999" }}>体位姿态: {pose || "-"}</p>

         {onDisarmClick && (
            <Button type='primary' danger size='large' onClick={onDisarmClick} style={{ marginTop: 4, width: 160 }}>
               撤防
            </Button>
         )}
         <p style={{ textAlign: "right", fontSize: "12px", color: "#999" }}>
            数据更新于: {lastUpdate ? dayjs(lastUpdate).format("YYYY-MM-DD HH:mm:ss") : "-/-/-"}
         </p>
      </div>
   );
};

export default RoomInfoFoot;
