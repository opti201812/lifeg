import React from "react";
import { Table, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { RoomPersonnel } from "../../types";

interface PersonnelTableProps {
   dataSource: RoomPersonnel[];
   loading: boolean;
   onViewDetails: (record: RoomPersonnel) => void;
   onAddPersonnel: (roomId: number) => void;
}

const PersonnelTable: React.FC<PersonnelTableProps> = ({ dataSource, loading, onViewDetails, onAddPersonnel }) => {
   // 表格列定义
   const columns = [
      {
         title: "房间号",
         dataIndex: ["room", "name"],
         key: "roomName",
      },
      {
         title: "人员姓名",
         key: "personnelName",
         dataIndex: ["personnel", "name"],
      },
      {
         title: "性别",
         key: "gender",
         render: (_: unknown, record: RoomPersonnel) => {
            return record.personnel ? record.personnel.gender : "-";
         },
      },
      {
         title: "年龄",
         key: "age",
         render: (_: unknown, record: RoomPersonnel) => {
            return record.personnel ? record.personnel.age : "-";
         },
      },
      {
         title: "身份证号",
         key: "idNumber",
         render: (_: unknown, record: RoomPersonnel) => {
            return record.personnel?.id_number ? record.personnel.id_number : "-";
         },
      },
      {
         title: "备注",
         dataIndex: ["room", "remark"],
         key: "remark",
         render: (text: string) => text || "-",
      },
      {
         title: "操作",
         key: "action",
         render: (_: unknown, record: RoomPersonnel) => {
            if (record.personnel) {
               return (
                  <Button type='link' onClick={() => onViewDetails(record)}>
                     查看详情
                  </Button>
               );
            }
            return (
               <Button type='primary' icon={<PlusOutlined />} onClick={() => onAddPersonnel(record.room.id)}>
                  设防
               </Button>
            );
         },
      },
   ];

   return (
      <Table
         columns={columns}
         dataSource={dataSource}
         rowKey={(record) => `${record.room.id}-${record.personnel?.id || "add"}`}
         loading={loading}
         pagination={{ pageSize: 10 }}
      />
   );
};

export default React.memo(PersonnelTable);
