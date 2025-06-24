import React from "react";
import { Table, Tag, Button, Tooltip } from "antd";
import { getBatteryStatus } from "../../utils";
import { useNavigate } from "react-router-dom";

interface BraceletTableProps {
   data: any[];
   loading: boolean;
   actionType: "armed" | "assigned" | "unassigned";
   onAction: (type: string, record: any) => void;
}

const BraceletTable: React.FC<BraceletTableProps> = ({ data, loading, actionType, onAction }) => {
   const navigate = useNavigate();

   const columns = [
      { title: "手环ID", dataIndex: "id", key: "id" },
      {
         title: "状态",
         key: "online",
         render: (_: any, record: any) => (
            <Tag color={record.online ? "green" : "red"}>{record.online ? "在线" : "离线"}</Tag>
         ),
      },
      {
         title: "人员",
         dataIndex: "personnelName",
         key: "personnelName",
         render: (name: string, record: any) => (
            <Button type='link' onClick={() => navigate(`/dashboard/personnel-management/${record.personnelId}`)}>
               {name}
            </Button>
         ),
      },
      {
         title: "所在房间",
         key: "roomName",
         render: (roomInfo: any, record: any) => (
            <Button type='link' onClick={() => navigate(`/dashboard/new-overview/${record.roomId}`)}>
               {roomInfo.roomName}
            </Button>
         ),
      },
      {
         title: "电池状态",
         key: "battery",
         render: (battery: number) => {
            const { isNormal, status } = getBatteryStatus(battery);
            return <Tag color={isNormal ? "green" : "red"}>{status || "-"}</Tag>;
         },
      },
      {
         title: "更新时间",
         dataIndex: "lastUpdate",
         key: "lastUpdate",
         render: (time: number) =>
            time
               ? new Date(time).toLocaleString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                 })
               : "未知",
      },
      {
         title: "操作",
         key: "action",
         render: (_: any, record: any) => {
            const actions = [];

            if (actionType === "armed") {
               actions.push(
                  <Button key='disarm' onClick={() => onAction("disarm", record)}>
                     撤防
                  </Button>,
                  <Button key='reclaim' danger onClick={() => onAction("reclaim", record)}>
                     收回
                  </Button>
               );
            } else if (actionType === "assigned") {
               actions.push(
                  <Button key='arm' type='primary' onClick={() => onAction("arm", record)}>
                     设防
                  </Button>,
                  <Button key='reclaim' danger onClick={() => onAction("reclaim", record)}>
                     收回
                  </Button>
               );
            } else {
               actions.push(
                  <Tooltip key='assign-tooltip' title='关联手环到人员' mouseEnterDelay={0.5}>
                     <Button key='assign' onClick={() => onAction("assign", record)}>
                        分配
                     </Button>
                  </Tooltip>,
                  <Tooltip key='arm-tooltip' title='关联手环和房间到人员并设防' mouseEnterDelay={0.5}>
                     <Button key='arm' type='primary' onClick={() => onAction("arm", record)}>
                        设防
                     </Button>
                  </Tooltip>
               );
            }

            return <div style={{ display: "flex", gap: 8 }}>{actions}</div>;
         },
      },
   ];

   return (
      <Table
         columns={columns}
         dataSource={data}
         rowKey='id'
         loading={loading}
         pagination={{ pageSize: 10 }}
         bordered
         locale={{ emptyText: "暂无数据" }}
      />
   );
};

export default BraceletTable;
