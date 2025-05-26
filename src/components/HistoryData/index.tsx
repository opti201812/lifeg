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
         } = item;

         return {
            日期时间: dayjs(time).format("YYYY-MM-DD HH:mm:ss"), // 转为日期时间格式
            人员编号: personnelId,
            手环心率: bracelet_heart_rate,
            雷达心率: radar_heart_rate,
            呼吸: breath_rate,
            距离: distance,
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
      },
      { title: "体位", dataIndex: "pose", key: "pose" },
      { title: "环境干扰", dataIndex: "environment_interference", key: "environment" },
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

         <Table dataSource={historicalData} columns={columns} />
      </div>
   );
};

export default HistoryData;
