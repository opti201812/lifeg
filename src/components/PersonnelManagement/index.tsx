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
         render: (value: string | string[]) => {
            // 如果value是数组，形如['d1','d0']
            if (Array.isArray(value)) {
               const labels = value.map((v) => {
                  const matchingHistory = MEDICAL_HISTORIES.find((item) => item.value === v);
                  return matchingHistory ? matchingHistory.label : v; // 找到则返回label，没找到则返回原值
               });
               // 如果有多项，用逗号分隔合并成字符串
               return labels.join(", ");
            }
            // 如果value是字符串
            else {
               const matchingHistory = MEDICAL_HISTORIES.find((item) => item.value === value);
               return matchingHistory ? matchingHistory.label : value; // Display label or original value if not found
            }
         },
      },
      { title: "其它病史/备注", dataIndex: "remark", key: "remark" },
      {
         title: "操作",
         key: "action",
         render: (_: any, record: any) => (
            <div style={{ display: "flex", alignItems: "center" }}>
               <Button onClick={() => navigate(`/dashboard/personnel-management/${record.id}`)}>编辑</Button>
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
