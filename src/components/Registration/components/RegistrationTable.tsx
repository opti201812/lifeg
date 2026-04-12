import React from "react";
import { Table, Button, Tag, Space, Modal } from "antd";
import { EditOutlined, DeleteOutlined, MedicineBoxOutlined } from "@ant-design/icons";
import { RegistrationRecord } from "../types";

interface RegistrationTableProps {
   dataSource: RegistrationRecord[];
   loading: boolean;
   onEdit: (record: RegistrationRecord) => void;
   onDelete: (record: RegistrationRecord) => void;
}

const RegistrationTable: React.FC<RegistrationTableProps> = ({
   dataSource,
   loading,
   onEdit,
   onDelete,
}) => {
   const handleDeleteClick = (record: RegistrationRecord) => {
      Modal.confirm({
         title: "确认删除",
         content: `确定要删除 ${record.name} 的检录记录吗？`,
         okText: "删除",
         cancelText: "取消",
         okButtonProps: { danger: true },
         onOk: () => onDelete(record),
      });
   };

   const columns = [
      { title: "编号", dataIndex: "id", key: "id", width: 120 },
      { title: "姓名", dataIndex: "name", key: "name", width: 100 },
      {
         title: "身份证号",
         dataIndex: "idNumber",
         key: "idNumber",
         width: 180,
         render: (text: string) => text?.replace(/^(\d{6})(\d+)(\d{2})$/, "$1********$3"),
      },
      {
         title: "性别",
         dataIndex: "gender",
         key: "gender",
         width: 80,
         render: (gender: string) => (gender === "male" ? "男" : "女"),
      },
      { title: "年龄", dataIndex: "age", key: "age", width: 80 },
      { title: "手环编号", dataIndex: "braceletId", key: "braceletId", width: 120 },
      { title: "血氧仪编号", dataIndex: "oximeterId", key: "oximeterId", width: 140 },
      { title: "心率", dataIndex: "heartRate", key: "heartRate", width: 80, render: (val: number) => val?.toFixed(0) },
      {
         title: "呼吸率",
         dataIndex: "breathRate",
         key: "breathRate",
         width: 80,
         render: (val: number) => val?.toFixed(0),
      },
      { title: "血氧", dataIndex: "spo2", key: "spo2", width: 80, render: (val: number) => val?.toFixed(1) },
      { title: "检录时间", dataIndex: "registrationTime", key: "registrationTime", width: 180 },
      {
         title: "状态",
         dataIndex: "status",
         key: "status",
         width: 120,
         render: (status: string, record: RegistrationRecord) => (
            <Space>
               <Tag color={status === "completed" ? "success" : "processing"}>
                  {status === "completed" ? "已完成" : "待完成"}
               </Tag>
               {record.oximeterEnabled && (
                  <MedicineBoxOutlined style={{ color: "#52c41a", fontSize: "16px" }} title='血氧仪已启用' />
               )}
            </Space>
         ),
      },
      {
         title: "操作",
         key: "action",
         width: 150,
         fixed: "right" as const,
         render: (_: any, record: RegistrationRecord) => (
            <Space size='small'>
               <Button type='link' icon={<EditOutlined />} onClick={() => onEdit(record)}>
                  编辑
               </Button>
               <Button type='link' danger icon={<DeleteOutlined />} onClick={() => handleDeleteClick(record)}>
                  删除
               </Button>
            </Space>
         ),
      },
   ];

   return (
      <Table
         dataSource={dataSource}
         columns={columns}
         rowKey='id'
         loading={loading}
         scroll={{ x: 1800 }}
         pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
         }}
      />
   );
};

export default RegistrationTable;

