// components/HistoryData/index.tsx
import React, { useState, useEffect } from "react";
import { Table, Button, Input, DatePicker, Select, Space, message, Form, Row, Col, Tooltip } from "antd";
import { SearchOutlined, ReloadOutlined, DownloadOutlined, PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import axios, { AxiosError } from "axios";
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
   time: string;
   // 手环新增字段
   bracelet_systolic_pressure?: number;
   bracelet_diastolic_pressure?: number;
   bracelet_blood_oxygen?: number;
   bracelet_body_temperature?: number;
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
   const [idNumberOptions, setIdNumberOptions] = useState<
      {
         value: string;
         key: string;
         label: string;
      }[]
   >([]); // 新增 idNumberOptions
   const [form] = Form.useForm();
   const [filters, setFilters] = useState<{
      personnelId: number | null;
      name: number | null; // 改为 number 类型因为存储的是 id
      idNumber: string;
      dateRange: dayjs.Dayjs[] | null;
      isAlarm: boolean | null;
   }>({
      personnelId: null,
      name: null,
      idNumber: "",
      dateRange: [dayjs().subtract(1, "day"), dayjs()],
      isAlarm: null,
   });
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      // Fetch initial personnel options for the dropdown
      const fetchPersonnelOptions = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/personnel`);

            const options = response.data.map((person: any) => ({
               value: person.id,
               key: person.id,
               label: person.id,
            }));
            setPersonnelOptions(options);

            // 修改 nameOptions，使用 id 作为 value
            const names = response.data.map((person: any) => ({
               value: person.id, // 使用 id 作为 value
               key: person.id,
               label: person.name,
            }));
            setNameOptions(names);

            // 获取 idNumberOptions，过滤掉空值
            const idNumbers = response.data
               .filter((person: any) => person.id_number && person.id_number.trim() !== "")
               .map((person: any) => ({
                  value: person.id,
                  key: person.id,
                  label: person.id_number,
               }));
            setIdNumberOptions(idNumbers);
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
      if (!filters.personnelId && !filters.name && !filters.idNumber) {
         message.warning("请选择人员编号或姓名或身份证号");
         return;
      }

      setLoading(true);
      try {
         const queryParams = new URLSearchParams();

         const selectedPersonnel = {
            name: "",
            id_number: "",
         };
         if (filters.personnelId) {
            queryParams.append("personnelId", filters.personnelId.toString());
            selectedPersonnel.name = nameOptions.find((p) => p.value === filters.personnelId?.toString())?.label || "";
            selectedPersonnel.id_number =
               idNumberOptions.find((p) => p.value === filters.personnelId?.toString())?.label || "";
         } else if (filters.name) {
            queryParams.append("personnelId", filters.name.toString());
            selectedPersonnel.name = nameOptions.find((p) => p.value === filters.name?.toString())?.label || "";
            selectedPersonnel.id_number =
               idNumberOptions.find((p) => p.value === filters.name?.toString())?.label || "";
         } else if (filters.idNumber) {
            queryParams.append("personnelId", filters.idNumber.toString());
            selectedPersonnel.name = nameOptions.find((p) => String(p.value) === filters.idNumber)?.label || "";
            selectedPersonnel.id_number =
               idNumberOptions.find((p) => String(p.value) === filters.idNumber)?.label || "";
         }

         if (filters.dateRange && (filters.dateRange as dayjs.Dayjs[]).length === 2) {
            queryParams.append("startDate", (filters.dateRange[0] as dayjs.Dayjs).format("YYYY-MM-DD HH:mm:ss"));
            queryParams.append("endDate", (filters.dateRange[1] as dayjs.Dayjs).format("YYYY-MM-DD HH:mm:ss"));
         }

         const response = await axios.get(`${config.backend.url}/history?${queryParams.toString()}`);
         const historicalDataWithPersonInfo = response.data.map((data: any) => ({
            ...data,
            name: selectedPersonnel.name,
            id_number: selectedPersonnel.id_number,
         }));
         setHistoricalData(historicalDataWithPersonInfo);
      } catch (error) {
         if (error instanceof AxiosError && error.response?.status === 404) {
            message.error("未找到该身份证号对应的人员");
         } else {
            console.error("Error fetching historical data:", error);
            message.error("获取历史数据失败！");
         }
      } finally {
         setLoading(false);
      }
   };

   const handleReset = () => {
      setFilters({
         personnelId: null,
         name: null,
         idNumber: "",
         dateRange: [dayjs().subtract(1, "day"), dayjs()], // Reset to the last 24 hours
         isAlarm: null,
      });
      form.resetFields();
   };

   const handleExport = () => {
      const newData = historicalData.map((item: any) => {
         /*
         {
    "time": "2025-05-26 12:54:12",
    "person_id": "15",
    "bracelet_heart_rate": "",
    "radar_heart_rate": "124",
    "breath_rate": "21",
    "distance": "106.67",
    "confidence": "65",
    "environment_interference": "97",
    "below60_heart_rate_count": "",
    "alarm_status": "1",
    "fall_status": "7",
    "dynamic_status": "",
    "battery_voltage": "",
    "tamper_status": "",
    "button_status": "",
    "personnelId": 15
}
         */
         const {
            time,
            person_id,
            bracelet_heart_rate,
            radar_heart_rate,
            breath_rate,
            distance,
            confidence,
            environment_interference,
            below60_heart_rate_count,
            alarm_status,
            fall_status,
            dynamic_status,
            battery_voltage,
            tamper_status,
            button_status,
            personnelId,
            // 手环新增字段
            bracelet_systolic_pressure,
            bracelet_diastolic_pressure,
            bracelet_blood_oxygen,
            bracelet_body_temperature,
         } = item;

         return {
            日期时间: dayjs(time).format("YYYY-MM-DD HH:mm:ss"), // 转为日期时间格式
            人员编号: personnelId,
            手环心率: bracelet_heart_rate,
            雷达心率: radar_heart_rate,
            呼吸: breath_rate,
            距离: distance,
            血压:
               bracelet_systolic_pressure && bracelet_diastolic_pressure
                  ? `${bracelet_diastolic_pressure}/${bracelet_systolic_pressure}`
                  : "-",
            血氧: bracelet_blood_oxygen ? `${bracelet_blood_oxygen}%` : "-",
            体温: bracelet_body_temperature ? `${bracelet_body_temperature}°C` : "-",
            环境干扰: environment_interference,
            SOS状态: button_status,
            手环状态: tamper_status,
            电池电压: battery_voltage,
         };
      });
      // Export to Excel
      const ws = XLSX.utils.json_to_sheet(newData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Historical Data");
      XLSX.writeFile(wb, "historical_data.xlsx");
   };

   // ... existing code ...
   const handlePrint = () => {
      // 创建打印内容
      const printContent = `
      <html>
         <head>
            <title>历史数据报告</title>
            <style>
               @media print {
                  * {
                     margin: 0;
                     padding: 0;
                     box-sizing: border-box;
                  }
                  
                  body {
                     font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
                     font-size: 12px;
                     line-height: 1.4;
                     color: #000;
                  }
                  
                  .print-container {
                     width: 100%;
                     margin: 20px;
                  }
                  
                  .print-title {
                     text-align: center;
                     font-size: 18px;
                     font-weight: bold;
                     margin-bottom: 20px;
                  }
                  
                  .print-table {
                     width: 100%;
                     border-collapse: collapse;
                     margin-bottom: 20px;
                  }
                  
                  .print-table th,
                  .print-table td {
                     border: 1px solid #000;
                     padding: 6px 4px;
                     text-align: left;
                     font-size: 10px;
                     word-wrap: break-word;
                  }
                  
                  .print-table th {
                     background-color: #f0f0f0;
                     font-weight: bold;
                  }
                  
                  .print-date {
                     text-align: right;
                     font-size: 10px;
                     margin-top: 10px;
                  }
                  
                  @page {
                     size: A4 landscape;
                     margin: 1cm;
                  }
               }
            </style>
         </head>
         <body>
            <div class="print-container">
               <div class="print-title">历史数据报告</div>
               <table class="print-table">
                  <thead>
                     <tr>
                        ${columns
                           .map((col) => {
                              const title =
                                 typeof col.title === "object" && col.title.props
                                    ? col.title.props.children
                                    : col.title;
                              return `<th>${title}</th>`;
                           })
                           .join("")}
                     </tr>
                  </thead>
                  <tbody>
                     ${historicalData
                        .map(
                           (row) => `
                        <tr>
                           ${columns
                              .map((col) => {
                                 const value = row[col.dataIndex as keyof typeof row];
                                 let displayValue = "";

                                 switch (col.dataIndex) {
                                    case "id_number":
                                       displayValue =
                                          typeof value === "string" && value
                                             ? value.replace(/^(\d{6})(\d+)(\d{2})$/, "$1********$3")
                                             : "";
                                       break;
                                    case "bracelet_heart_rate":
                                       displayValue = value ? String(value) : "N/A";
                                       break;
                                    case "tamper_status":
                                       displayValue = value ? "是" : "否";
                                       break;
                                    case "apnea":
                                       displayValue = parseInt(String(value)) > 0 ? "是" : "否";
                                       break;
                                    case "bracelet_systolic_pressure":
                                    case "bracelet_diastolic_pressure":
                                    case "bloodPressure":
                                       // 血压特殊处理
                                       if (col.key === "bloodPressure") {
                                          const systolic = row.bracelet_systolic_pressure;
                                          const diastolic = row.bracelet_diastolic_pressure;
                                          displayValue = systolic && diastolic ? `${diastolic}/${systolic}` : "-";
                                       } else {
                                          displayValue = String(value || "");
                                       }
                                       break;
                                    case "bracelet_blood_oxygen":
                                       displayValue = value ? `${value}%` : "-";
                                       break;
                                    case "bracelet_body_temperature":
                                       displayValue = value ? `${value}°C` : "-";
                                       break;
                                    case "time":
                                       displayValue = dayjs(String(value)).format("YYYY-MM-DD HH:mm:ss");
                                       break;
                                    default:
                                       displayValue = String(value || "");
                                 }

                                 return `<td>${displayValue}</td>`;
                              })
                              .join("")}
                        </tr>
                     `
                        )
                        .join("")}
                  </tbody>
               </table>
               <div class="print-date">打印时间: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}</div>
            </div>
         </body>
      </html>
   `;

      // 创建新窗口并打印
      const printWindow = window.open("", "_blank");
      if (printWindow) {
         printWindow.document.write(printContent);
         printWindow.document.close();

         // 等待内容加载完成后打印
         printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
         };
      } else {
         message.error("无法打开打印窗口，请检查浏览器弹窗设置");
      }
   };
   // ... existing code ...
   const columns = [
      { title: "人员编号", dataIndex: "person_id", key: "personnel_id" },
      { title: "姓名", dataIndex: "name", key: "name" },
      {
         title: "身份证号",
         dataIndex: "id_number",
         key: "id_number",
         render: (text: string) => {
            if (!text) return "";
            // 保留前6位和最后2位，中间用*代替
            return text.replace(/^(\d{6})(\d+)(\d{2})$/, "$1********$3");
         },
      },
      {
         title: "手环心率",
         dataIndex: "bracelet_heart_rate",
         key: "bracelet_heart_rate",
         render: (value: number) => value ?? "N/A",
      },
      {
         title: "手环报警",
         dataIndex: "tamper_status",
         key: "tamper_status",
         render: (alarm: boolean) => <span style={{ color: alarm ? "red" : "inherit" }}>{alarm ? "是" : "否"}</span>,
      },
      {
         title: <Tooltip title='次/分钟'>雷达心率</Tooltip>,
         // heart_rate 或 radar_heart_rate
         dataIndex: "radar_heart_rate",
         key: "heart_rate",
      },
      {
         title: <Tooltip title='次/分钟'>雷达呼吸</Tooltip>,
         dataIndex: "breath_rate",
         key: "breath_rate",
      },
      {
         title: <Tooltip title='米（雷达测量距离）'>雷达距离</Tooltip>,
         dataIndex: "distance",
         key: "distance",
         render: (text: string) => (text ? (parseInt(text) / 100).toFixed(1) : ""),
      },
      { title: "体位", dataIndex: "pose", key: "pose" },
      {
         title: "呼吸暂停",
         dataIndex: "apnea",
         key: "apnea",
         render: (text: string) => (parseInt(text) > 0 ? "是" : "否"),
      },
      { title: "环境干扰", dataIndex: "environment_interference", key: "environment" },
      {
         title: <Tooltip title='收缩压/舒张压 (mmHg)'>血压</Tooltip>,
         key: "bloodPressure",
         render: (_: any, record: HistoricalData) => {
            const { bracelet_systolic_pressure, bracelet_diastolic_pressure } = record;
            if (bracelet_systolic_pressure && bracelet_diastolic_pressure) {
               return `${bracelet_diastolic_pressure}/${bracelet_systolic_pressure}`;
            }
            return "-";
         },
      },
      {
         title: <Tooltip title='血氧饱和度 (%)'>血氧</Tooltip>,
         dataIndex: "bracelet_blood_oxygen",
         key: "bracelet_blood_oxygen",
         render: (value: number) => (value ? `${value}%` : "-"),
      },
      {
         title: <Tooltip title='体温 (°C)'>体温</Tooltip>,
         dataIndex: "bracelet_body_temperature",
         key: "bracelet_body_temperature",
         render: (value: number) => (value ? `${value}°C` : "-"),
      },
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
               // 当 personnelId 或 name 或 idNumber 改变时，清空其他两个
               if (changedValues.personnelId !== undefined) {
                  allValues.name = null;
                  allValues.idNumber = "";
               }
               if (changedValues.name !== undefined) {
                  allValues.personnelId = null;
                  allValues.idNumber = "";
               }
               if (changedValues.idNumber !== undefined) {
                  allValues.personnelId = null;
                  allValues.name = null;
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
                        disabled={!!filters.name || !!filters.idNumber}
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
                        disabled={!!filters.personnelId || !!filters.idNumber}
                     />
                  </Form.Item>
               </Col>
               <Col span={6}>
                  <Form.Item label='身份证号' name='idNumber'>
                     <Select
                        showSearch
                        placeholder='请选择身份证号'
                        optionFilterProp='children'
                        filterOption={(input, option) =>
                           (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                        options={idNumberOptions}
                        allowClear
                        disabled={!!filters.personnelId || !!filters.name}
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
                  <Button type='primary' htmlType='submit' icon={<SearchOutlined />} loading={loading}>
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

         <Table dataSource={historicalData} columns={columns} rowKey={(record) => record.time} />
      </div>
   );
};

export default HistoryData;
