// components/PersonnelManagement/index.tsx
import React, { useState, useCallback, useEffect } from "react";
import { Table, Button, Modal, message } from "antd";
import { settingSpace } from "../../styles/theme";
import axios from "axios";
import config from "../../config";
import { MEDICAL_HISTORIES, Personnel, Room } from "../../types";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const PersonnelManagement: React.FC = () => {
   const [personnelData, setPersonnelData] = useState<Personnel[]>([]); // Changed 'users' to 'personnelData'
   const navigate = useNavigate();

   useEffect(() => {
      const fetchPersonnel = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/personnel`);

            setPersonnelData(response.data);
         } catch (error) {
            console.error("Error fetching personnel:", error);
            message.error("Failed to load personnel");
         }
      };
      fetchPersonnel();
   }, []);

   const handleDeletePersonnel = useCallback(
      async (id: number) => {
         Modal.confirm({
            title: "确认删除",
            icon: <ExclamationCircleOutlined />,
            content: "您确定要删除该人员吗？",
            okText: "确定",
            cancelText: "取消",
            onOk: async () => {
               try {
                  await axios.delete(`${config.backend.url}/personnel/${id}`);
                  setPersonnelData(personnelData.filter((u) => u.id !== id)); // Update personnelData
                  message.success("Personnel deleted successfully");
               } catch (error) {
                  console.error("Error deleting personnel:", error);
                  message.error("Failed to delete personnel");
               }
            },
         });
      },
      [config.backend.url, personnelData]
   );

   const columns = [
      { title: "编号", dataIndex: "id", key: "id" }, // Access nested property
      { title: "姓名", dataIndex: "name", key: "name" }, // Access nested property
      { title: "身份证号码", dataIndex: "id_number", key: "id_number" }, // Access nested property
      { title: "职业", dataIndex: "occupation", key: "occupation" }, // Access nested property
      { title: "年龄", dataIndex: "age", key: "age" }, // Access nested property
      { title: "心率", dataIndex: "heart_rate", key: "heart_rate" }, // Access nested property
      { title: "呼吸", dataIndex: "breath_rate", key: "breath_rate" }, // Access nested property
      {
         title: "病史",
         dataIndex: "medical_history",
         key: "medical_history",
         render: (value: string) => {
            const matchingHistory = MEDICAL_HISTORIES.find((item) => item.value === value);
            return matchingHistory ? matchingHistory.label : value; // Display label or original value if not found
         },
      }, // Access nested property
      { title: "备注", dataIndex: "remark", key: "remark" }, // Access nested property
      {
         title: "操作",
         key: "action",
         render: (_: any, record: any) => (
            <>
               <Button onClick={() => navigate(`/personnel-management/${record.id}`)}>编辑</Button>{" "}
               {/* Navigate to edit page */}
               <Button onClick={() => handleDeletePersonnel(record.id)}>删除</Button>
            </>
         ),
      },
   ];

   return (
      <div style={settingSpace}>
         <h2>人员信息管理</h2>
         <Button type='primary' onClick={() => navigate(`/personnel-management/new`)}>
            新增人员
         </Button>
         <Table dataSource={personnelData} columns={columns} rowKey='id' />
      </div>
   );
};

export default PersonnelManagement;
