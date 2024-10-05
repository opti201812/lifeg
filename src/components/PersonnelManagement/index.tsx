// components/PersonnelManagement/index.tsx
import React, { useState, useCallback, useEffect } from "react";
import { Table, Button, message } from "antd";
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

            setPersonnelData(response.data);
         } catch (error) {
            console.error("Error fetching personnel:", error);
            message.error("获取人员信息失败");
         }
      };
      fetchPersonnel();
   }, []);

   const columns = [
      { title: "人员编号", dataIndex: "id", key: "id" }, // Access nested property
      { title: "姓名", dataIndex: "name", key: "name" }, // Access nested property
      { title: "身份证号码", dataIndex: "id_number", key: "id_number" }, // Access nested property
      { title: "职业", dataIndex: "occupation", key: "occupation" }, // Access nested property
      { title: "年龄", dataIndex: "age", key: "age" }, // Access nested property
      { title: "性别", dataIndex: "gender", key: "gender" },
      { title: "平均心率", dataIndex: "heart_rate", key: "heart_rate" }, // Access nested property
      { title: "平均呼吸次数", dataIndex: "breath_rate", key: "breath_rate" }, // Access nested property
      {
         title: "病史",
         dataIndex: "medical_history",
         key: "medical_history",
         render: (value: string) => {
            const matchingHistory = MEDICAL_HISTORIES.find((item) => item.value === value);
            return matchingHistory ? matchingHistory.label : value; // Display label or original value if not found
         },
      },
      { title: "其它病史", dataIndex: "remark", key: "remark" }, // Access nested property
      {
         title: "操作",
         key: "action",
         render: (_: any, record: any) => (
            <div style={{ display: "flex", alignItems: "center" }}>
               <Button onClick={() => navigate(`/personnel-management/${record.id}`)}>编辑</Button>
               <Link to={`/entry-exit-management`} style={{ marginLeft: "8px" }}>
                  进出场
               </Link>
            </div>
         ),
      },
   ];

   return (
      <div style={settingSpace}>
         <h2>人员管理</h2>
         <Button type='primary' onClick={() => navigate(`/personnel-management/new`)}>
            新增人员
         </Button>
         <Table dataSource={personnelData} columns={columns} rowKey='id' />
      </div>
   );
};

export default PersonnelManagement;
