import React from "react";
import { Table, Button } from "antd";
import { RoomPersonnel } from "../../types";

interface PersonnelTableProps {
   dataSource: (RoomPersonnel & { deviceInfo?: any; braceletStatus?: string; sortType?: number })[];
   loading: boolean;
   onViewDetails: (record: RoomPersonnel) => void;
   onAddPersonnel: (roomId: number) => void;
}

const PersonnelTable: React.FC<PersonnelTableProps> = ({ dataSource, loading, onViewDetails, onAddPersonnel }) => {
   const columns = [
      { title: "房间", dataIndex: ["room", "name"], key: "room" },
      {
         title: "姓名",
         key: "name",
         render: (_: any, record: any) => record.personnel?.name || "-",
      },
      {
         title: "操作",
         key: "action",
         render: (_: any, record: any) => (
            record.personnel ? (
               <Button type='link' onClick={() => onViewDetails(record)}>
                  查看
               </Button>
            ) : (
               <Button type='link' onClick={() => onAddPersonnel(record.room.id)}>
                  设防
               </Button>
            )
         ),
      },
   ];

   return (
      <Table
         rowKey={(r) => `${r.room.id}-${r.associationId}`}
         dataSource={dataSource as any}
         columns={columns as any}
         loading={loading}
         pagination={false}
      />
   );
};

export default React.memo(PersonnelTable);
