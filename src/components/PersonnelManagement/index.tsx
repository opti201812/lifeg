// components/PersonnelManagement/index.tsx
import React, { useState, useCallback, useEffect } from "react";
import { Table, Button, message, Popconfirm } from "antd";
import { settingSpace } from "../../styles/theme";
import axios from "axios";
import config from "../../config";
import { MEDICAL_HISTORIES, Personnel, Room } from "../../types";
import { useNavigate, Link } from "react-router-dom";

const PersonnelManagement: React.FC = () => {
   const [personnelData, setPersonnelData] = useState<Personnel[]>([]); // Changed 'users' to 'personnelData'
   const navigate = useNavigate();

   useEffect(() => {
      const fetchPersonnel = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/personnel`);

            setPersonnelData(response.data?.data || response.data || []);
         } catch (error) {
            console.error("Error fetching personnel:", error);
            message.error("获取人员信息失败");
         }
      };
      fetchPersonnel();
   }, []);

   const handleDelete = useCallback(async (id: number | string) => {
      try {
         await axios.delete(`${config.backend.url}/personnel/${id}`);
         setPersonnelData((prev) => prev.filter((p) => String(p.id) !== String(id)));
         message.success("人员已删除");
      } catch (error: any) {
         const backendMsg = error?.response?.data?.error;
         message.error(backendMsg || "删除人员失败");
      }
   }, []);

   const columns = [
      { title: "人员编号", dataIndex: "id", key: "id" },
      { title: "姓名", dataIndex: "name", key: "name" },
      { title: "身份证号码", dataIndex: "id_number", key: "id_number" },
      { title: "职业", dataIndex: "occupation", key: "occupation" },
      { title: "年龄", dataIndex: "age", key: "age" },
      {
         title: "性别",
         dataIndex: "gender",
         key: "gender",
         render: (gender: string) => {
            return gender === "male" ? "男" : "女";
         },
      },
      { title: "平均心率", dataIndex: "heart_rate", key: "heart_rate" },
      { title: "平均呼吸次数", dataIndex: "breath_rate", key: "breath_rate" },
      {
         title: "病史",
         dataIndex: "medical_history",
         key: "medical_history",
         render: (value: string) => {
            const matchingHistory = MEDICAL_HISTORIES.find((item) => item.value === value);
            return matchingHistory ? matchingHistory.label : value; // Display label or original value if not found
         },
      },
      { title: "其它病史/备注", dataIndex: "remark", key: "remark" },
      {
         title: "操作",
         key: "action",
         render: (_: any, record: any) => (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
               <Button onClick={() => navigate(`/dashboard/personnel-management/${record.id}`)}>编辑</Button>
               <Popconfirm
                  title='确认删除该人员？'
                  description='删除后该人员将从系统中移除，不可恢复。'
                  okText='删除'
                  okButtonProps={{ danger: true }}
                  cancelText='取消'
                  onConfirm={() => handleDelete(record.id)}
               >
                  <Button danger>删除</Button>
               </Popconfirm>
            </div>
         ),
      },
   ];

   return (
      <div style={settingSpace}>
         <h2>人员管理</h2>
         <Button type='primary' onClick={() => navigate(`/dashboard/personnel-management/new`)}>
            新增人员
         </Button>
         <Table dataSource={personnelData} columns={columns} rowKey='id' />
      </div>
   );
};

export default PersonnelManagement;
