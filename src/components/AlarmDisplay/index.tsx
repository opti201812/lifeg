// components/AlarmDisplay/index.tsx

import React, { useState, useEffect } from "react";
import { Table, Button, Input, DatePicker, Select, Space, message, Form, Row, Col } from "antd";
import { SearchOutlined, ReloadOutlined, DownloadOutlined, PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import config from "../../config";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx"; // Import XLSX for Excel export

const { RangePicker } = DatePicker;

interface AlarmData {
   personnelId: number;
   name: string;
   heartRate: number;
   breathRate: number;
   distance: number;
   alarmLevel: string;
   handlingMethod: string;
   handlingTime: string;
   dateTime: string;
}

const AlarmDisplay: React.FC = () => {
   const [alarmData, setAlarmData] = useState<AlarmData[]>([]);
   const [personnelOptions, setPersonnelOptions] = useState<
      {
         value: number;
         key: number;
         label: string;
      }[]
   >([]);
   const [nameOptions, setNameOptions] = useState<
      {
         value: number; // 注意：这里 value 存储的是人员 id
         key: number;
         label: string;
      }[]
   >([]);
   const [form] = Form.useForm();
   const [filters, setFilters] = useState({
      personnelId: null,
      name: "",
      dateRange: null,
      alarmLevel: null,
      handlingTimeRange: null,
   });

   useEffect(() => {
      const fetchPersonnelOptions = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/personnel`);
            const options = response.data.map((person: any) => ({
               value: person.id,
               key: person.id,
               label: person.id,
            }));
            setPersonnelOptions(options);

            const names = response.data.map((person: any) => ({
               value: person.id, // 注意：这里 value 存储的是人员 id
               key: person.id,
               label: person.name,
            }));
            setNameOptions(names);
         } catch (error) {
            console.error("Error fetching personnel options:", error);
            message.error("获取人员信息失败！");
         }
      };

      fetchPersonnelOptions();
      handleSearch();
   }, []);

   // 使用useEffect，当filters.name不为空时，删除columns中的name列
   useEffect(() => {
      if (filters.name) {
         const updatedColumns = initialColumns.filter((column) => column.dataIndex !== "name");
         setColumns(updatedColumns);
      } else {
         setColumns(initialColumns);
      }
   }, [filters.name]);

   const handleSearch = async () => {
      try {
         const queryParams = new URLSearchParams();
         if (filters.personnelId) {
            queryParams.append("personnelId", (filters.personnelId as number).toString());
         }
         // 当选择姓名时，使用对应的 id 发送请求
         if (filters.name) {
            queryParams.append("personnelId", filters.name);
         }
         if (filters.dateRange && (filters.dateRange as dayjs.Dayjs[]).length === 2) {
            queryParams.append("startDate", (filters.dateRange[0] as dayjs.Dayjs).format("YYYY-MM-DD HH:mm:ss"));
            queryParams.append("endDate", (filters.dateRange[1] as dayjs.Dayjs).format("YYYY-MM-DD HH:mm:ss"));
         }
         if (filters.alarmLevel) {
            queryParams.append("alarmLevel", filters.alarmLevel);
         }
         if (filters.handlingTimeRange && (filters.handlingTimeRange as dayjs.Dayjs[]).length === 2) {
            queryParams.append(
               "handlingStart",
               (filters.handlingTimeRange[0] as dayjs.Dayjs).format("YYYY-MM-DD HH:mm:ss")
            );
            queryParams.append(
               "handlingEnd",
               (filters.handlingTimeRange[1] as dayjs.Dayjs).format("YYYY-MM-DD HH:mm:ss")
            );
         }

         const response = await axios.get(`${config.backend.url}/history/alarms?${queryParams.toString()}`);
         setAlarmData(response.data || []);
      } catch (error) {
         console.error("Error fetching alarm data:", error);
         message.error("获取报警数据失败！");
      }
   };

   const handleReset = () => {
      setFilters({
         personnelId: null,
         name: "",
         dateRange: null,
         alarmLevel: null,
         handlingTimeRange: null,
      });
      form.resetFields();
   };

   const handleExport = () => {
      // Implement your export logic here (e.g., generate CSV or Excel file)
      const newData = alarmData.map((item: any) => ({
         ID: item.id,
         房间编号: item.room_id,
         人员编号: item.personnel_id,
         心率: item.heart_rate,
         呼吸频率: item.breath_rate,
         距离: item.distance,
         报警等级: item.alarm_level,
         处理时间: item.handling_time,
         处理方式: item.handling_method,
      }));
      const ws = XLSX.utils.json_to_sheet(newData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Alarm Data");
      XLSX.writeFile(wb, "alarm_data.xlsx");
   };

   const handlePrint = () => {
      const doc = new jsPDF();
      autoTable(doc, {
         head: [columns.map((col) => col.key)],
         // body: alarmData.map((row) => columns.map((col) => col.render ? col.render(row[col.dataIndex]) : row[col.dataIndex])),
         body: alarmData.map((row) => Object.values(row)),
      });
      doc.autoPrint();
      doc.output("dataurlnewwindow");
   };

   const initialColumns = [
      { title: "人员编号", dataIndex: "personnel_id", key: "personnelId" },
      { title: "姓名", dataIndex: "name", key: "name" },
      { title: "心率(次/分)", dataIndex: "heart_rate", key: "heartRate" },
      { title: "呼吸(次/分)", dataIndex: "breath_rate", key: "breathRate" },
      {
         title: "距离(米)",
         dataIndex: "distance",
         key: "distance",
         render: (text: string) => {
            return text ? (parseInt(text) / 100).toFixed(2) : "";
         },
      },
      {
         title: "告警级别",
         dataIndex: "alarm_level",
         key: "alarmLevel",
         render: (alarmLevel: string) => {
            switch (alarmLevel) {
               case "1":
                  return "极度危险";
               case "2":
                  return "危险";
               case "3":
                  return "异常";
               default:
                  return "无";
            }
         },
      },
      { title: "处理方法", dataIndex: "handling_method", key: "handlingMethod" },
      {
         title: "处理时间",
         dataIndex: "handling_time",
         key: "handlingTime",
         render: (handlingTime: string) => (handlingTime ? dayjs(handlingTime).format("YYYY-MM-DD HH:mm:ss") : ""),
      },
      {
         title: "告警时间",
         dataIndex: "create_date",
         key: "dateTime",
         render: (dateTime: string) => dayjs(dateTime).format("YYYY-MM-DD HH:mm:ss"),
      },
   ];

   const [columns, setColumns] = useState(initialColumns);

   return (
      <div>
         <h2>告警信息</h2>
         <Form
            layout='vertical'
            onFinish={handleSearch}
            form={form}
            onValuesChange={(changedValues, allValues) => {
               if (changedValues.personnelId !== undefined) {
                  allValues.name = "";
               }
               if (changedValues.name !== undefined) {
                  allValues.personnelId = null;
               }
               setFilters(allValues);
            }}
         >
            <Row gutter={16}>
               <Col span={4}>
                  <Form.Item label='人员编号' name='personnelId'>
                     <Select
                        showSearch
                        placeholder='请选择人员编号'
                        optionFilterProp='children'
                        filterOption={(input, option) =>
                           (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                        options={personnelOptions}
                        allowClear
                        disabled={!!filters.name}
                     />
                  </Form.Item>
               </Col>
               <Col span={5}>
                  <Form.Item label='姓名' name='name'>
                     <Select
                        showSearch
                        placeholder='请选择姓名'
                        optionFilterProp='children'
                        filterOption={(input, option) =>
                           (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                        options={nameOptions}
                        allowClear
                        disabled={!!filters.personnelId}
                     />
                  </Form.Item>
               </Col>
               <Col span={5}>
                  <Form.Item label='告警级别' name='alarmLevel'>
                     <Select allowClear placeholder='请选择' disabled>
                        <Select.Option key='1' value='1'>
                           极度危险
                        </Select.Option>
                        <Select.Option key='2' value='2'>
                           危险
                        </Select.Option>
                        <Select.Option key='3' value='3'>
                           异常
                        </Select.Option>
                     </Select>
                  </Form.Item>
               </Col>
               {/* 新增：处理时间筛选 */}
               <Col span={5}>
                  <Form.Item label='处理时间' name='handlingTimeRange'>
                     <RangePicker />
                  </Form.Item>
               </Col>
               <Col span={5}>
                  <Form.Item label='告警时间' name='dateRange'>
                     <RangePicker />
                  </Form.Item>
               </Col>
            </Row>
            <Form.Item style={{ textAlign: "right" }}>
               {/* 将按钮居右 */}
               <Space>
                  <Button type='primary' htmlType='submit' icon={<SearchOutlined />}>
                     查询
                  </Button>
                  <Button onClick={handleReset} icon={<ReloadOutlined />}>
                     重置
                  </Button>
                  <Button onClick={handleExport} icon={<DownloadOutlined />}>
                     导出
                  </Button>
                  <Button onClick={handlePrint} icon={<PrinterOutlined />}>
                     打印
                  </Button>{" "}
               </Space>
            </Form.Item>
         </Form>

         <Table dataSource={alarmData} columns={columns} key={"id"} />
      </div>
   );
};

export default AlarmDisplay;
