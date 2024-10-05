// components/HistoryData/index.tsx
import React, { useState, useEffect } from "react";
import { Table, Button, Input, DatePicker, Select, Space, message, Form, Row, Col } from "antd";
import { SearchOutlined, ReloadOutlined, DownloadOutlined, PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import config from "../../config";
import { jsPDF } from "jspdf"; // Import jsPDF for PDF generation
import autoTable from "jspdf-autotable"; // Import autoTable plugin for table generation in PDF
import * as XLSX from "xlsx"; // Import XLSX for Excel export

const { RangePicker } = DatePicker;

interface HistoricalData {
   personnelId: number;
   name: string;
   heartRate: number;
   breathRate: number;
   distance: number;
   isAlarm: boolean;
   dateTime: string;
}

const HistoryData: React.FC = () => {
   const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
   const [personnelOptions, setPersonnelOptions] = useState<
      {
         value: number;
         key: number;
         label: string;
      }[]
   >([]);
   const [nameOptions, setNameOptions] = useState<
      {
         value: string;
         key: string;
         label: string;
      }[]
   >([]); // 新增 nameOptions
   const [form] = Form.useForm();
   const [filters, setFilters] = useState({
      personnelId: null,
      name: "",
      dateRange: [dayjs().subtract(1, "day"), dayjs()], // Initial date range for the last 24 hours
      isAlarm: null,
   });

   useEffect(() => {
      // Fetch initial personnel options for the dropdown
      const fetchPersonnelOptions = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/personnel`);

            const options = response.data.map((person: any) => ({
               value: person.id, // 修改为 id
               key: person.id,
               label: person.id,
            }));
            setPersonnelOptions(options);

            // 获取 nameOptions
            const names = response.data.map((person: any) => ({
               value: person.id,
               key: person.id,
               label: person.name,
            }));
            setNameOptions(names.map((name: any) => ({ value: name.value, key: name.key, label: name.label })));
         } catch (error) {
            console.error("Error fetching personnel options:", error);
            message.error("获取人员列表失败");
         }
      };

      fetchPersonnelOptions();

      // Fetch initial historical data
      handleSearch(); // Call handleSearch to fetch initial data
   }, []);

   const handleSearch = async () => {
      try {
         const queryParams = new URLSearchParams();
         if (filters?.personnelId) {
            queryParams.append("personnelId", (filters?.personnelId as number).toString());
         }
         if (filters?.name) {
            queryParams.append("personnelId", filters.name);
         }
         if (filters.dateRange && (filters.dateRange as dayjs.Dayjs[]).length === 2) {
            queryParams.append("startDate", (filters.dateRange[0] as dayjs.Dayjs).format("YYYY-MM-DD HH:mm:ss"));
            queryParams.append("endDate", (filters.dateRange[1] as dayjs.Dayjs).format("YYYY-MM-DD HH:mm:ss"));
         }
         if (filters?.isAlarm !== null && filters?.isAlarm !== undefined) {
            queryParams.append("isAlarm", (filters.isAlarm as boolean).toString());
         }

         const response = await axios.get(`${config.backend.url}/history?${queryParams.toString()}`);
         setHistoricalData(response.data || []);
      } catch (error) {
         console.error("Error fetching historical data:", error);
         message.error("获取历史信息失败！");
      }
   };

   const handleReset = () => {
      setFilters({
         personnelId: null,
         name: "",
         dateRange: [dayjs().subtract(1, "day"), dayjs()], // Reset to the last 24 hours
         isAlarm: null,
      });
      form.resetFields();
   };

   const handleExport = () => {
      const newData = historicalData.map((item: any) => {
         const {
            time,
            room_id,
            personnel_id,
            breath_rate,
            breathRateMax,
            breathRateMin,
            heart_rate,
            heartRateMax,
            heartRateMin,
            u60heart_rate,
            u60heartRateMax,
            u60heartRateMin,
            target_distance,
            targetDistanceMax,
            targetDistanceMin,
            environment,
         } = item;

         return {
            人员编号: personnel_id,
            房间编号: room_id,
            心率: heart_rate,
            呼吸: breath_rate,
            距离: target_distance,
            日期时间: time,
         };
      });
      // Export to Excel
      const ws = XLSX.utils.json_to_sheet(newData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Historical Data");
      XLSX.writeFile(wb, "historical_data.xlsx");
   };

   const handlePrint = async () => {
      // Generate PDF and print
      const doc = new jsPDF();
      const op = {
         head: [columns.map((col) => col.key)],
         body: historicalData.map((row) => Object.values(row)),
      };
      autoTable(doc, op);
      doc.autoPrint();
      doc.output("dataurlnewwindow"); // Open in new window for printing
   };

   const columns = [
      { title: "人员编号", dataIndex: "personnel_id", key: "personnel_id" },
      { title: "姓名", dataIndex: "name", key: "name" },
      { title: "心率(次/分)", dataIndex: "heart_rate", key: "heart_rate" },
      { title: "呼吸(次/分)", dataIndex: "breath_rate", key: "breath_rate" },
      {
         title: "距离(米)",
         dataIndex: "target_distance",
         key: "target_distance",
         render: (text: string, record: any) => {
            return (parseInt(text) / 100).toFixed(2);
         },
      }, // Assuming 'distance' is 'target_distance' in the API response
      // {
      //    title: "是否告警",
      //    dataIndex: "is_alarm", // Assuming 'isAlarm' is 'is_alarm' in the API response
      //    key: "is_alarm",
      //    render: (isAlarm: boolean) => (
      //       <span style={{ color: isAlarm ? "red" : "inherit" }}>{isAlarm ? "是" : "否"}</span>
      //    ),
      // },
      {
         title: "日期时间",
         dataIndex: "time",
         key: "time",
         render: (dateTime: string) => dayjs(dateTime).format("YYYY-MM-DD HH:mm:ss"),
      },
   ];

   return (
      <div>
         <h2>历史数据</h2>
         <Form
            layout='vertical'
            onFinish={handleSearch}
            form={form}
            onValuesChange={(changedValues, allValues) => {
               // 当 personnelId 改变时，清空 name
               if (changedValues.personnelId !== undefined) {
                  allValues.name = "";
               }
               // 当 name 改变时，清空 personnelId
               if (changedValues.name !== undefined) {
                  allValues.personnelId = null;
               }
               setFilters(allValues);
            }}
         >
            <Row gutter={16}>
               <Col span={6}>
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
                        disabled={!!filters.name} // 禁用 name 输入框，如果 personnelId 已选
                     />
                  </Form.Item>
               </Col>
               <Col span={6}>
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
                        disabled={!!filters.personnelId} // 禁用 name 输入框，如果 personnelId 已选
                     />
                  </Form.Item>
               </Col>
               <Col span={6}>
                  <Form.Item label='起止时间' name='dateRange'>
                     <RangePicker showTime />
                  </Form.Item>
               </Col>
               {/* <Col span={6}>
                  <Form.Item label='是否告警' name='isAlarm'>
                     <Select allowClear placeholder='请选择'>
                        <Select.Option value={true}>是</Select.Option>
                        <Select.Option value={false}>否</Select.Option>
                     </Select>
                  </Form.Item>
               </Col> */}
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

         <Table dataSource={historicalData} columns={columns} />
      </div>
   );
};

export default HistoryData;
