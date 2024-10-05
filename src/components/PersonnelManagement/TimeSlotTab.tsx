// components/PersonnelManagement/TimeSlotTab.tsx

import React, { useState, useEffect, forwardRef } from "react";
import { Form, Table, Button, Space, Modal, message, Input } from "antd";
import DatePicker, { DateObject } from "react-multi-date-picker";
// import type { DateObject } from "react-multi-date-picker";
import axios from "axios";
import config from "../../config";
import { PersonnelSchedule } from "../../types";
import TimeRangePicker from "./TimeRangePicker";
import "./styles.css";

const { TextArea } = Input;

const MultilineInput = React.forwardRef<HTMLTextAreaElement, React.HTMLProps<HTMLTextAreaElement>>((props, ref) => {
   const formatDates = (value: string) => {
      return value
         .split(",")
         .map((dateRange) => {
            const [start, end] = dateRange.trim().split(" ~ ");
            return start === end || !end ? start : `${start} ~ ${end}`;
         })
         .join("\n");
   };

   const datesWithNewLine = formatDates(props.value + "");

   return (
      <TextArea
         ref={ref}
         {...props}
         value={datesWithNewLine}
         className='multiline-input'
         style={{ width: "100%", height: "auto", whiteSpace: "pre-wrap", resize: "none" }}
         autoSize={{ minRows: 2, maxRows: 6 }}
         // Ensure size is compatible with TextAreaProps
         size='large' // Example value, adjust as needed
         onResize={() => {}} // Use the correct handler
      />
   );
});

interface TimeSlotTabProps {
   form: any;
   fields: any[];
   add: (defaultValue?: any) => void;
   remove: (index: number) => void;
   initialSchedules: PersonnelSchedule[];
}

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
            daysOfWeek: JSON.parse(schedule.days_of_week).map((days: any) => {
               if (days.length === 1) {
                  return [new DateObject(days[0])];
               }
               return [new DateObject(days[0]), new DateObject(days[1])];
            }),
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
         console.log("==> ~ values:", values);
         const scheduleData: PersonnelSchedule = {
            start_time: values.timeRange[0],
            end_time: values.timeRange[1],
            days_of_week: JSON.stringify(
               values.daysOfWeek.map((dates: [DateObject, DateObject]) => {
                  console.log("==> ~ dates:", dates);
                  if (dates.length < 2) return [dates[0].format("YYYY-MM-DD")];

                  return [dates[0].format("YYYY-MM-DD"), dates[1]?.format("YYYY-MM-DD")];
               })
            ),
         };

         if (!scheduleData.start_time.includes(":")) scheduleData.start_time += ":00";
         if (!scheduleData.end_time.includes(":")) scheduleData.end_time += ":00";
         if (selectedSchedule) {
            // Editing existing schedule
            scheduleData.id = selectedSchedule.id;
            await axios.put(`${config.backend.url}/personnel/${personnelId}/schedules`, [scheduleData]);
            message.success("更新时间段成功");

            console.log(
               "==> ~ allSchedules, scheduleData, selectedSchedule.id:",
               allSchedules,
               scheduleData,
               selectedSchedule.id
            );
            // 更新 allSchedules 狀態~
            setAllSchedules(
               allSchedules.map((schedule) => (schedule.id === selectedSchedule.id ? scheduleData : schedule))
            );
         } else {
            // Adding new schedule
            const response = await axios.post(`${config.backend.url}/personnel/${personnelId}/schedules`, scheduleData);
            const newSchedule = response.data; // Assuming backend returns the new schedule with ID

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

   // const handleOk = async () => {
   //    if (!personnelId) {
   //       message.error("请先保存基本信息");
   //       return;
   //    }
   //    try {
   //       const values = await scheduleForm.validateFields();

   //       const scheduleData: PersonnelSchedule = {
   //          start_time: values.timeRange[0],
   //          end_time: values.timeRange[1],
   //          days_of_week: values.daysOfWeek.sort((a: number, b: number) => a - b).join(","),
   //       };

   //       if (selectedSchedule) {
   //          // Editing existing schedule
   //          scheduleData.id = selectedSchedule.id;
   //          console.log("==> ~ scheduleData:", scheduleData, allSchedules);
   //          await axios.put(`${config.backend.url}/personnel/${personnelId}/schedules`, [scheduleData]);
   //          message.success("更新时间段成功");

   //          // 更新 allSchedules 狀態~
   //          setAllSchedules(
   //             allSchedules.map((schedule) => (schedule.id === selectedSchedule.id ? scheduleData : schedule))
   //          );
   //       } else {
   //          // Adding new schedule
   //          const response = await axios.post(`${config.backend.url}/personnel/${personnelId}/schedules`, scheduleData);
   //          const newSchedule = response.data; // Assuming backend returns the new schedule with ID
   //          console.log("==> ~ newSchedule:", newSchedule);

   //          // 更新 allSchedules 狀態
   //          setAllSchedules([...allSchedules, newSchedule]);
   //          message.success("新增时间段成功");
   //       }

   //       setIsModalVisible(false);
   //    } catch (error) {
   //       console.error("Error saving schedule:", error);
   //       message.error("保存时间段失败");
   //    }
   // };

   const handleCancel = () => {
      setIsModalVisible(false);
   };

   const handleTimeRangeChange = (newTimeRange: [string, string]) => {
      const formattedTimeRange = newTimeRange.map((time) => {
         // 检查时间字符串是否包含冒号
         if (!time.includes(":")) {
            return `${time}:00`;
         }
         return time;
      }) as [string, string];
      console.log("==> ~ formattedTimeRange:", formattedTimeRange);

      setTimeRange(formattedTimeRange);
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
         title: "适用日期",
         dataIndex: ["days_of_week"],
         key: "days_of_week",
         render: (text: string) => {
            const formattedRanges = JSON.parse(text).map((range: [string, string]) => {
               const [start, end] = range;
               return `${start}` + (end ? ` 至 ${end}` : "");
            });
            const formattedText = formattedRanges.join("，");

            // Check if the formatted text exceeds 80 characters
            if (formattedText.length > 80) {
               return `${formattedText.substring(0, 80)}...`;
            }
            return formattedText;
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
   const [dates, setDates] = useState<DateObject[][]>([[], []]);

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
               <Form.Item label='适用日期' name='daysOfWeek' rules={[{ required: true, message: "请选择适用的日期" }]}>
                  <DatePicker
                     range
                     multiple
                     value={dates}
                     onChange={setDates}
                     format='YYYY-MM-DD'
                     style={{ display: "block" }}
                     render={<MultilineInput />}
                  />
               </Form.Item>
            </Form>
         </Modal>
      </div>
   );
};

export default TimeSlotTab;
