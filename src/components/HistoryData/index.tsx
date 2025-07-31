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
      dataCategory: string; // 新增数据类别选择
   }>({
      personnelId: null,
      name: null,
      idNumber: "",
      dateRange: [dayjs().subtract(1, "day"), dayjs()],
      isAlarm: null,
      dataCategory: "basic", // 默认为基础体征
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

         // TODO: 根据数据类别调用不同的API端点
         // 基础体征: /history/basic
         // 体征分析: /history/analysis
         // 综合评测: /history/evaluation
         const apiEndpoint = filters.dataCategory === "basic" ? "/history" : `/history/${filters.dataCategory}`;

         const response = await axios.get(`${config.backend.url}${apiEndpoint}?${queryParams.toString()}`);
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
         dataCategory: "basic", // 重置为默认的基础体征
      });
      form.resetFields();
   };

   const handleExport = () => {
      const newData = historicalData.map((item: any) => {
         const baseData = {
            日期时间: dayjs(item.time).format("YYYY-MM-DD HH:mm:ss"),
            人员编号: item.personnelId,
            姓名: item.name,
         };

         switch (filters.dataCategory) {
            case "basic":
               return {
                  ...baseData,
                  手环心率: item.bracelet_heart_rate || "N/A",
                  雷达心率: item.radar_heart_rate,
                  呼吸: item.breath_rate,
                  距离: item.distance ? (parseInt(item.distance) / 100).toFixed(1) : "",
                  体位: item.pose,
                  呼吸暂停: parseInt(item.apnea) > 0 ? "是" : "否",
                  环境干扰: item.environment_interference,
                  手环报警: item.tamper_status ? "是" : "否",
               };
            case "analysis":
               return {
                  ...baseData,
                  // TODO: 根据实际API返回的数据结构调整
                  心率变异性: item.hrv || "N/A",
                  呼吸变异性: item.brv || "N/A",
                  活动强度: item.activity_level || "N/A",
                  睡眠质量: item.sleep_quality || "N/A",
                  压力指数: item.stress_index || "N/A",
               };
            case "evaluation":
               return {
                  ...baseData,
                  // TODO: 根据实际API返回的数据结构调整
                  健康评分: item.health_score || "N/A",
                  风险评估: item.risk_assessment || "N/A",
                  建议措施: item.recommendations || "N/A",
                  趋势分析: item.trend_analysis || "N/A",
               };
            default:
               return baseData;
         }
      });

      // Export to Excel
      const ws = XLSX.utils.json_to_sheet(newData);
      const wb = XLSX.utils.book_new();
      const sheetName =
         filters.dataCategory === "basic"
            ? "基础体征数据"
            : filters.dataCategory === "analysis"
            ? "体征分析数据"
            : "综合评测数据";
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${sheetName}_${dayjs().format("YYYY-MM-DD")}.xlsx`);
   };

   // ... existing code ...
   const handlePrint = () => {
      // 根据数据类别获取报告标题
      const getReportTitle = () => {
         switch (filters.dataCategory) {
            case "basic":
               return "基础体征历史数据报告";
            case "analysis":
               return "体征分析历史数据报告";
            case "evaluation":
               return "综合评测历史数据报告";
            default:
               return "历史数据报告";
         }
      };

      // 创建打印内容
      const printContent = `
      <html>
         <head>
            <title>${getReportTitle()}</title>
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
               <div class="print-title">${getReportTitle()}</div>
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
   // 根据数据类别获取表格列配置
   const getColumns = (dataCategory: string) => {
      const baseColumns = [
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
            title: "日期时间",
            dataIndex: "time",
            key: "time",
            render: (dateTime: string) => dayjs(dateTime).format("YYYY-MM-DD HH:mm:ss"),
         },
      ];

      switch (dataCategory) {
         case "basic":
            return [
               ...baseColumns,
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
                  render: (alarm: boolean) => (
                     <span style={{ color: alarm ? "red" : "inherit" }}>{alarm ? "是" : "否"}</span>
                  ),
               },
               {
                  title: <Tooltip title='次/分钟'>雷达心率</Tooltip>,
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
            ];
         case "analysis":
            return [
               ...baseColumns,
               // TODO: 添加体征分析相关的列
               { title: "心率变异性", dataIndex: "hrv", key: "hrv" },
               { title: "呼吸变异性", dataIndex: "brv", key: "brv" },
               { title: "活动强度", dataIndex: "activity_level", key: "activity_level" },
               { title: "睡眠质量", dataIndex: "sleep_quality", key: "sleep_quality" },
               { title: "压力指数", dataIndex: "stress_index", key: "stress_index" },
            ];
         case "evaluation":
            return [
               ...baseColumns,
               // TODO: 添加综合评测相关的列
               { title: "健康评分", dataIndex: "health_score", key: "health_score" },
               { title: "风险评估", dataIndex: "risk_assessment", key: "risk_assessment" },
               { title: "建议措施", dataIndex: "recommendations", key: "recommendations" },
               { title: "趋势分析", dataIndex: "trend_analysis", key: "trend_analysis" },
            ];
         default:
            return baseColumns;
      }
   };

   const columns = getColumns(filters.dataCategory);

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
                  <Form.Item label='数据类别' name='dataCategory'>
                     <Select placeholder='请选择数据类别'>
                        <Select.Option value='basic'>基础体征</Select.Option>
                        <Select.Option value='analysis'>体征分析</Select.Option>
                        <Select.Option value='evaluation'>综合评测</Select.Option>
                     </Select>
                  </Form.Item>
               </Col>
            </Row>
            <Row gutter={16}>
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
