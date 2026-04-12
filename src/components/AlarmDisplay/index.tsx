// components/AlarmDisplay/index.tsx

import React, { useState, useEffect } from "react";
import { Table, Button, Input, DatePicker, Select, Space, message, Form, Row, Col, Tooltip, Tabs } from "antd";
import { SearchOutlined, ReloadOutlined, DownloadOutlined, PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import axios, { AxiosError } from "axios";
import config from "../../config";
import * as ExcelJS from "exceljs";

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
   const [dataCategory, setDataCategory] = useState<string>("basic"); // 基础体征/心率分析/睡眠分析/综合评测
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
   const [idNumberOptions, setIdNumberOptions] = useState<{ value: string; key: string; label: string }[]>([]);
   const [form] = Form.useForm();
   const [filters, setFilters] = useState<{
      personnelId: number | null;
      name: number | null; // 改为 number 类型因为存储的是 id
      idNumber: string;
      dateRange: dayjs.Dayjs[] | null;
      handlingTimeRange: dayjs.Dayjs[] | null;
   }>({
      personnelId: null,
      name: null,
      idNumber: "",
      dateRange: null,
      handlingTimeRange: null,
   });
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      const fetchPersonnelOptions = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/personnel`);
            const personnelData = response.data?.data || response.data || [];
            const options = personnelData.map((person: any) => ({
               value: person.id,
               key: person.id,
               label: person.id,
            }));
            setPersonnelOptions(options);

            const names = personnelData.map((person: any) => ({
               value: person.id,
               key: person.id,
               label: person.name,
            }));
            setNameOptions(names);

            // 获取 idNumberOptions，过滤掉空值
            const idNumbers = personnelData
               .filter((person: any) => person.id_number && person.id_number.trim() !== "")
               .map((person: any) => ({
                  value: person.id,
                  key: person.id,
                  label: person.id_number,
               }));
            setIdNumberOptions(idNumbers);
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
      if (!filters.personnelId && !filters.name && !filters.idNumber) {
         message.warning("请选择人员编号或姓名或身份证号");
         return;
      }

      setLoading(true);
      try {
         const queryParams = new URLSearchParams();
         queryParams.append("category", dataCategory);
         const selectedPersonnel = { name: "", id_number: "" };

         if (filters.personnelId) {
            queryParams.append("personnelId", filters.personnelId.toString());
            selectedPersonnel.name = nameOptions.find((p) => p.value === filters.personnelId)?.label || "";
            selectedPersonnel.id_number =
               idNumberOptions.find((p) => p.value === filters.personnelId?.toString())?.label || "";
         } else if (filters.name) {
            queryParams.append("personnelId", filters.name.toString());
            selectedPersonnel.name = nameOptions.find((p) => p.value === filters.name)?.label || "";
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
         // 从 personnelOptions、nameOptions、idNumberOptions 中查找当前人员的姓名、身份证号码，然后与response.data进行合并

         // 处理API响应数据，映射字段名称并保持兼容性
         const alarmDataWithPersonInfo = response.data
            .map((alarm: any) => ({
               ...alarm,
               // 字段映射：新API返回的字段映射到旧字段名
               personnel_id: alarm.personnel_id || alarm.personnelId,
               heart_rate: alarm.radar_heart_rate || alarm.heart_rate || alarm.radarHeartRate,
               breath_rate: alarm.breath_rate || alarm.breathRate,
               distance: alarm.distance,
               pose: alarm.pose,
               apnea: alarm.apnea || alarm.vitalSign || "0",
               environment: alarm.environment_interference || alarm.environment || alarm.environmentInterference || "0",
               alarm_level: alarm.alarm_status || alarm.alarm_level || alarm.alarmStatus,
               button_status: alarm.bracelet_button_status || alarm.button_status || alarm.buttonStatus || "0",
               create_date: alarm.time || alarm.create_date,
               handling_time: alarm.handling_time || alarm.handlingTime,
               name: selectedPersonnel.name,
               id_number: selectedPersonnel.id_number,
            }))
            .sort((a: any, b: any) => new Date(b.create_date).getTime() - new Date(a.create_date).getTime());

         setAlarmData(alarmDataWithPersonInfo);
      } catch (error) {
         if (error instanceof AxiosError && error.response?.status === 404) {
            message.error("未找到该身份证号对应的人员");
         } else {
            console.error("Error fetching alarm data:", error);
            message.error("获取报警数据失败！");
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
         dateRange: null,
         handlingTimeRange: null,
      });
      form.resetFields();
   };

   const handleExport = async () => {
      try {
         // 创建新的工作簿
         const workbook = new ExcelJS.Workbook();
         const worksheet = workbook.addWorksheet("Alarm Data");

         // 准备导出数据
         const newData = alarmData.map((item: any) => ({
            人员编号: item.personnel_id,
            姓名: item.name,
            身份证号: item.id_number,
            心率: item.heart_rate,
            呼吸: item.breath_rate,
            雷达距离: (parseInt(item.distance) / 100).toFixed(2),
            报警: item.alarm_level ? "是" : "否",
            体位: item.pose,
            环境: item.environment,
            告警级别: item.alarm_level,
            报警时间: dayjs(item.create_date).format("YYYY-MM-DD HH:mm:ss"),
         }));

         // 添加表头
         const headers = Object.keys(newData[0]);
         worksheet.addRow(headers);

         // 设置表头样式
         const headerRow = worksheet.getRow(1);
         headerRow.font = { bold: true };
         headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE6E6FA" },
         };

         // 添加数据行
         newData.forEach((row: any) => {
            const values = headers.map((header) => row[header]);
            worksheet.addRow(values);
         });

         // 自动调整列宽
         worksheet.columns.forEach((column) => {
            if (column && column.eachCell) {
               let maxLength = 0;
               column.eachCell({ includeEmpty: true }, (cell) => {
                  const columnLength = cell.value ? cell.value.toString().length : 10;
                  if (columnLength > maxLength) {
                     maxLength = columnLength;
                  }
               });
               column.width = Math.min(maxLength + 2, 20);
            }
         });

         // 生成文件名并下载
         const fileName = `alarm_data_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
         const buffer = await workbook.xlsx.writeBuffer();

         // 创建下载链接
         const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
         const url = window.URL.createObjectURL(blob);
         const link = document.createElement("a");
         link.href = url;
         link.download = fileName;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         window.URL.revokeObjectURL(url);

         message.success("导出成功");
      } catch (error) {
         console.error("导出失败:", error);
         message.error("导出失败，请重试");
      }
   };

   const handlePrint = () => {
      // 创建打印内容
      const printContent = `
         <html>
            <head>
               <title>告警信息报告</title>
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
                  <div class="print-title">告警信息报告</div>
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
                        ${alarmData
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
                                       case "button_status":
                                          displayValue = value ? "是" : "否";
                                          break;
                                       case "distance":
                                          displayValue = value ? (parseInt(String(value)) / 100).toFixed(1) : "";
                                          break;
                                       case "apnea":
                                          displayValue = parseInt(String(value)) > 0 ? "是" : "否";
                                          break;
                                       case "alarm_level":
                                          switch (String(value)) {
                                             case "1":
                                                displayValue = "极度危险";
                                                break;
                                             case "2":
                                                displayValue = "危险";
                                                break;
                                             case "3":
                                                displayValue = "异常";
                                                break;
                                             default:
                                                displayValue = "-";
                                          }
                                          break;
                                       case "create_date":
                                          displayValue = dayjs(String(value)).format("YYYY-MM-DD HH:mm:ss");
                                          break;
                                       case "handling_time":
                                          displayValue = value
                                             ? dayjs(String(value)).format("YYYY-MM-DD HH:mm:ss")
                                             : "";
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

   const initialColumns = [
      { title: "人员编号", dataIndex: "personnel_id", key: "personnelId" },
      { title: "姓名", dataIndex: "name", key: "name" },
      {
         title: "身份证号",
         dataIndex: "id_number",
         key: "id_number",
         render: (text: string) => text?.replace(/^(\d{6})(\d+)(\d{2})$/, "$1********$3") || "",
      },
      {
         title: "手环报警",
         dataIndex: "button_status",
         key: "button_status",
         render: (alarm: boolean) => <span style={{ color: alarm ? "red" : "inherit" }}>{alarm ? "是" : "否"}</span>,
      },
      {
         title: <Tooltip title='次/分钟'>心率</Tooltip>,
         dataIndex: "heart_rate",
         key: "radar_heart_rate",
      },
      {
         title: <Tooltip title='次/分钟'>呼吸</Tooltip>,
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
      { title: "环境干扰", dataIndex: "environment", key: "environment" },
      {
         title: "告警级别",
         dataIndex: "alarm_level",
         key: "alarm_level",
         render: (level: string) => {
            switch (level) {
               case "1":
                  return "极度危险";
               case "2":
                  return "危险";
               case "3":
                  return "异常";
               default:
                  return "-";
            }
         },
      },
      // { title: "处理方法", dataIndex: "handling_method", key: "handlingMethod" },
      // {
      //    title: "处理时间",
      //    dataIndex: "handling_time",
      //    key: "handlingTime",
      //    render: (time: string) => (time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : ""),
      // },
      {
         title: "告警时间",
         dataIndex: "create_date",
         key: "dateTime",
         render: (time: string) => dayjs(time).format("YYYY-MM-DD HH:mm:ss"),
      },
   ];

   const [columns, setColumns] = useState(initialColumns);

   const categoryItems = [
      { key: "basic", label: "基础体征" },
      { key: "analysis", label: "心率分析" },
      { key: "sleep", label: "睡眠分析" },
      { key: "comprehensive", label: "综合评测" },
   ];

   return (
      <div style={{ padding: "24px" }}>
         <h2>告警信息</h2>
         {/* 数据类别Tab，与历史数据一致 */}
         <div
            style={{
               background: "#fff",
               borderRadius: "8px",
               boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
               marginBottom: "16px",
               padding: "0 0px",
            }}
         >
            <Tabs
               activeKey={dataCategory}
               onChange={setDataCategory}
               items={categoryItems}
               style={{ margin: 0, padding: "0 16px" }}
               tabBarStyle={{ marginBottom: 0, borderBottom: "1px solid #f0f0f0" }}
            />
         </div>
         <div
            style={{
               background: "#fff",
               borderRadius: "8px",
               boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
               padding: "24px",
            }}
         >
            <Form
               layout='vertical'
               onFinish={handleSearch}
               form={form}
               onValuesChange={(changedValues, allValues) => {
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
                           disabled={!!filters.name || !!filters.idNumber}
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
                           disabled={!!filters.personnelId || !!filters.idNumber}
                        />
                     </Form.Item>
                  </Col>
                  <Col span={5}>
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

            <Table dataSource={alarmData} columns={columns} key={"id"} rowKey={"id"} />
         </div>
      </div>
   );
};

export default AlarmDisplay;
