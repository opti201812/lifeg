// components/PersonnelManagement/TimeSlotTab.tsx

import React, { useState, useEffect } from "react";
import { Form, Table, Button, Space, Modal, message, DatePicker, Select } from "antd";
import axios from "axios";
import config from "../../config";
import { PersonnelSchedule } from "../../types";
import dayjs from "dayjs";
import TimeRangePicker from "./TimeRangePicker";

interface TimeSlotTabProps {
   form: any;
   fields: any[];
   add: (defaultValue?: any) => void;
   remove: (index: number) => void;
   initialSchedules: PersonnelSchedule[];
}

const daysOfWeekOptions = [
   { value: "1", label: "周一" },
   { value: "2", label: "周二" },
   { value: "3", label: "周三" },
   { value: "4", label: "周四" },
   { value: "5", label: "周五" },
   { value: "6", label: "周六" },
   { value: "7", label: "周日" },
];

const TimeSlotTab: React.FC<TimeSlotTabProps> = ({ form, fields, add, remove, initialSchedules }) => {
   const [isModalVisible, setIsModalVisible] = useState(false);
   const [selectedSchedule, setSelectedSchedule] = useState<PersonnelSchedule | null>(null);
   const [allSchedules, setAllSchedules] = useState<PersonnelSchedule[]>(initialSchedules);
   const [personnelId, setPersonnelId] = useState<number | null>(null);
   const [scheduleForm] = Form.useForm(); // Renamed form instance for the modal
   const [timeRange, setTimeRange] = useState<[string, string]>([
      "00:00", // 默认起始时间
      "00:00", // 默认结束时间
   ]);

   useEffect(() => {
      if (form) {
         const personnelIdValue = form.getFieldValue(["id"]);
         setPersonnelId(personnelIdValue ? parseInt(personnelIdValue, 10) : null);
      }
   }, [form]);

   const showModal = (schedule?: PersonnelSchedule) => {
      setSelectedSchedule(schedule || null);
      setIsModalVisible(true);

      if (schedule) {
         scheduleForm.setFieldsValue({
            timeRange: [schedule.start_time, schedule.end_time], // 直接使用字符串
            daysOfWeek: schedule.days_of_week.split(","),
         });
      } else {
         scheduleForm.resetFields();
      }
   };

   const handleOk = async () => {
      if (!personnelId) {
         message.error("请先保存基本信息");
         return;
      }
      try {
         const values = await scheduleForm.validateFields();

         const scheduleData: PersonnelSchedule = {
            start_time: values.timeRange[0],
            end_time: values.timeRange[1],
            days_of_week: values.daysOfWeek.sort((a: number, b: number) => a - b).join(","),
         };

         if (selectedSchedule) {
            // Editing existing schedule
            scheduleData.id = selectedSchedule.id;
            console.log("==> ~ scheduleData:", scheduleData, allSchedules);
            await axios.put(`${config.backend.url}/personnel/${personnelId}/schedules`, [scheduleData]);
            message.success("更新时间段成功");

            // 更新 allSchedules 狀態~
            setAllSchedules(
               allSchedules.map((schedule) => (schedule.id === selectedSchedule.id ? scheduleData : schedule))
            );
         } else {
            // Adding new schedule
            const response = await axios.post(`${config.backend.url}/personnel/${personnelId}/schedules`, scheduleData);
            const newSchedule = response.data; // Assuming backend returns the new schedule with ID
            console.log("==> ~ newSchedule:", newSchedule);

            // 更新 allSchedules 狀態
            setAllSchedules([...allSchedules, newSchedule]);
            message.success("新增时间段成功");
         }

         setIsModalVisible(false);
      } catch (error) {
         console.error("Error saving schedule:", error);
         message.error("保存时间段失败");
      }
   };

   const handleCancel = () => {
      setIsModalVisible(false);
   };

   const handleTimeRangeChange = (newTimeRange: [string, string]) => {
      setTimeRange(newTimeRange);
   };

   const confirmRemove = (record: PersonnelSchedule) => {
      Modal.confirm({
         title: "确认删除？",
         content: "您确定要删除这个时间段吗？",
         onOk: async () => {
            try {
               await axios.delete(`${config.backend.url}/personnel/${personnelId}/schedules/${record.id}`);

               // Refetch schedules after delete
               const response = await axios.get(`${config.backend.url}/personnel/${personnelId}/schedules`);
               setAllSchedules(response.data);
               message.success("删除成功");
            } catch (error) {
               console.error("Error deleting schedule:", error);
               message.error("删除时间段失败");
            }
         },
         onCancel() {
            message.info("已取消删除");
         },
      });
   };

   const columns = [
      {
         title: "开始时间",
         dataIndex: ["start_time"],
         key: "start_time",
      },
      {
         title: "结束时间",
         dataIndex: ["end_time"],
         key: "end_time",
         render: (endTime: string, record: PersonnelSchedule) => {
            const startTime = record.start_time;

            // Compare times (assuming 24-hour format)
            const isEndTimeLessThanStartTime = endTime < startTime;

            if (isEndTimeLessThanStartTime) {
               return `${endTime} (次日)`;
            } else {
               return endTime;
            }
         },
      },
      {
         title: "适用于周几",
         dataIndex: ["days_of_week"],
         key: "days_of_week",
         render: (text: string) => {
            const daysOfWeek = text.split(",");
            const dayNames = daysOfWeek.map(
               (day) => daysOfWeekOptions.find((option) => option.value === day)?.label || ""
            );
            return dayNames.join("、");
         },
      },
      {
         title: "操作",
         key: "action",
         render: (_: any, record: PersonnelSchedule) => (
            <Space size='middle'>
               <a onClick={() => showModal(record)}>编辑</a>
               <a onClick={() => confirmRemove(record)}>删除</a>
            </Space>
         ),
      },
   ];

   return (
      <div>
         <Button type='dashed' onClick={() => showModal()}>
            添加搁置时间段
         </Button>
         <Table columns={columns} dataSource={fields.length > 0 ? fields[0].value : allSchedules} rowKey='id' />

         {/* Modal for editing/adding schedules */}
         <Modal
            title={selectedSchedule ? "编辑时间段" : "新增时间段"}
            open={isModalVisible}
            onOk={handleOk}
            onCancel={handleCancel}
         >
            <Form form={scheduleForm}>
               <Form.Item
                  label='开始时间'
                  name='timeRange' // Use 'value' instead of 'defaultValue'
                  rules={[{ required: true, message: "请选择开始和结束时间" }]}
               >
                  <TimeRangePicker value={timeRange} onChange={handleTimeRangeChange} />
               </Form.Item>
               <Form.Item label='适用周几' name='daysOfWeek' rules={[{ required: true, message: "请输入适用的周几" }]}>
                  <Select mode='multiple' placeholder='请选择适用周几'>
                     {daysOfWeekOptions.map((item) => (
                        <Select.Option key={item.value} value={item.value}>
                           {item.label}
                        </Select.Option>
                     ))}
                  </Select>
               </Form.Item>
            </Form>
         </Modal>
      </div>
   );
};

export default TimeSlotTab;
