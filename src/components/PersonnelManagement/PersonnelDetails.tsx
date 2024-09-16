import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Input, Select, Button, message, Tabs, Tooltip } from "antd";
import axios from "axios";
import config from "../../config";
import { Personnel, Room } from "../../types";
import BasicInfoForm from "./BasicInfoForm";
import TimeSlotTab from "./TimeSlotTab";
import { settingSpace } from "../../styles/theme";
import { QuestionCircleOutlined } from "@ant-design/icons";

const PersonnelDetails: React.FC = () => {
   const { id } = useParams<{ id: string }>(); // Get personnel ID from URL params
   const navigate = useNavigate();
   const [form] = Form.useForm();
   const [personnel, setPersonnel] = useState<Personnel | null>(null);
   const [isLoading, setIsLoading] = useState(false);
   const isNewPersonnel = id === "new"; // Flag to indicate new personnel

   useEffect(() => {
      const fetchPersonnel = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/personnel/${id}`);
            setPersonnel(response.data);
         } catch (error) {
            console.error("Error fetching personnel:", error);
            message.error("加载人员详情失败！");
         }
      };

      if (id && id !== "new") {
         setIsLoading(true);
         fetchPersonnel();
      } else {
         // If adding new personnel, set isLoading to false and reset the form
         setIsLoading(false);
         form.resetFields();
      }
   }, [id]);

   useEffect(() => {
      if (personnel) {
         setIsLoading(false);
         form.setFieldsValue(personnel);
      }
   }, [personnel]);

   const handleSave = async (values: any) => {
      try {
         const basicInfo = values || {};
         const timeSlots = values.timeSlots || [];

         const personnelData: Personnel = {
            ...basicInfo,
            schedules: timeSlots,
         };

         if (personnel) {
            // Editing existing personnel
            personnelData.id = personnel.id;
            await axios.put(`${config.backend.url}/personnel/${personnel.id}`, personnelData);
            message.success("更新人员信息成功");
         } else {
            // Adding new personnel
            await axios.post(`${config.backend.url}/personnel`, personnelData);
            message.success("添加人员成功");
         }
         navigate("/personnel-management"); // Redirect back to personnel management
      } catch (error) {
         console.error("Error saving personnel:", error);
         message.error("保存人员信息失败！");
      }
   };

   const tabItems = [
      {
         key: "1",
         label: "基本信息",
         children: <BasicInfoForm form={form} editingPersonnel={personnel} />,
      },
      // 只有在编辑现有用户时才显示“搁置时间段”tab
      !isNewPersonnel && {
         key: "2",
         label: (
            <Tooltip title='当处于搁置时间段时，不采集改用户所在房间数据，不处理报警'>
               <span>
                  搁置时间段 <QuestionCircleOutlined />
               </span>
            </Tooltip>
         ),
         children: (
            <Form.List name='timeSlots'>
               {(fields, { add, remove }) => (
                  <TimeSlotTab
                     form={form}
                     fields={fields}
                     add={add}
                     remove={remove}
                     initialSchedules={personnel?.schedules || []}
                  />
               )}
            </Form.List>
         ),
      },
   ].filter(Boolean) as any[]; // 过滤掉 undefined 的元素并转换为 any[] 数组

   return (
      <div style={settingSpace}>
         <h2>人员信息</h2>
         {isLoading ? (
            <p>Loading...</p>
         ) : (
            <Form
               form={form}
               name='basic'
               labelCol={{ span: 8 }}
               wrapperCol={{ span: 16 }}
               onFinish={handleSave}
               autoComplete='off'
            >
               <Tabs defaultActiveKey='1' items={tabItems}>
                  {" "}
               </Tabs>
               <Form.Item
                  wrapperCol={{ span: 24 }}
                  style={{
                     textAlign: "center",
                  }}
               >
                  <Button type='primary' htmlType='submit'>
                     保存
                  </Button>{" "}
                  <Button type='default' onClick={() => navigate("/personnel-management")}>
                     返回
                  </Button>
               </Form.Item>
            </Form>
         )}
      </div>
   );
};

export default PersonnelDetails;
