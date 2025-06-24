import React from "react";
import { Card, Col, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Room, Association } from "../../types";

interface AddPersonnelCardProps {
   room: Room;
   associations: Association[];
   roomTypes: any[];
   roomTemplates: any[];
   onAddClick: (roomId: number) => void;
}

const AddPersonnelCard: React.FC<AddPersonnelCardProps> = ({
   room,
   associations,
   roomTypes,
   roomTemplates,
   onAddClick,
}) => {
   // 获取房间最大人员数：room.typeId -> roomType.templateId -> template.maxPersonnel
   const roomType = roomTypes.find((rt) => rt.typeId === room.typeId);
   const template = roomType ? roomTemplates.find((t) => t.templateId === roomType.templateId) : null;
   const maxPersonnel = template?.maxPersonnel || 1;
   const currentCount = associations.filter((a) => a.roomId === room.id).length;

   return (
      <Col span={6} key={`${room.id}-add`}>
         <Card
            bordered={false}
            className='add-personnel-card'
            styles={{ body: { padding: "16px" } }}
            style={{ minHeight: "280px" }} // 设置最小高度，与有人员的卡片保持一致
         >
            <div
               style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  minHeight: "240px", // 内容区域最小高度
               }}
            >
               <Button
                  type='primary'
                  icon={<PlusOutlined />}
                  onClick={() => onAddClick(room.id)}
                  style={{ marginBottom: 16 }}
                  size='large'
               >
                  设防
               </Button>
               <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: 8 }}>{room.name}</div>
               <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
                  当前人数: {currentCount}/{maxPersonnel}
               </div>
               {roomType && <div style={{ fontSize: 10, color: "#aaa" }}>类型: {roomType.typeName}</div>}
            </div>
         </Card>
      </Col>
   );
};

export default React.memo(AddPersonnelCard);
