import React from "react";
import { Tag, Typography } from "antd";

export const RoomInfo: React.FC<{
   roomName: string;
   age: number;
   gender: string;
   type: string;
}> = ({ roomName, age, gender, type }) => {
   return (
      <div
         style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
         }}
      >
         <Typography.Title level={5} style={{ margin: 0 }}>
            {" "}
            {/* Use Typography.Title for small title */}
            {type ? type + "曲线" : "实时数据"}
         </Typography.Title>

         <div>
            <Tag color='blue'>房间：{roomName}</Tag>
            <Tag color='green'>年龄：{age}</Tag>
            <Tag color='purple'>性别：{gender}</Tag>
         </div>
      </div>
   );
};
