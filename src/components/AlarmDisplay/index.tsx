// components/AlarmDisplay/index.tsx

import React, { useState, useEffect } from "react";
import { Table, Button, Input, DatePicker, Select, Space, message, Form, Row, Col, Tooltip } from "antd";
import { SearchOutlined, ReloadOutlined, DownloadOutlined, PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import axios, { AxiosError } from "axios";
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
            const options = response.data.map((person: any) => ({
               value: person.id,
               key: person.id,
               label: person.id,
            }));
            setPersonnelOptions(options);

            const names = response.data.map((person: any) => ({
               value: person.id,
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

         // 方案1：前端排序（如果后端未支持排序）
         const alarmDataWithPersonInfo = response.data
            .map((alarm: any) => ({
               ...alarm,
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

   const handleExport = () => {
      /*
      {
    "id": "1748077768293-pcgbv5350",
    "room_id": "",
    "personnel_id": "15",
    "heart_rate": "152",
    "breath_rate": "",
    "distance": "240",
    "pose": "",
    "environment": "20",
    "alarm_level": "",
    "handler_id": "",
    "handling_method": "",
    "handling_time": "",
    "create_date": "2025-05-24T09:09:14.804Z",
    "update_date": "",
    "personnelId": null
}
      */
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

      const ws = XLSX.utils.json_to_sheet(newData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Alarm Data");
      XLSX.writeFile(wb, "alarm_data.xlsx");
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

   return (
      <div>
         <h2>告警信息</h2>
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
   );
};

export default AlarmDisplay;
