// components/HistoryData/index.tsx
import React, { useState, useEffect } from "react";
import { Table, Button, Input, DatePicker, Select, Space, message, Form, Row, Col } from "antd";
import { SearchOutlined, ReloadOutlined, DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import config from "../../config";

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
         label: string;
      }[]
   >([]);
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
               value: person.id,
               label: person.name,
            }));
            setPersonnelOptions(options);
         } catch (error) {
            console.error("Error fetching personnel options:", error);
            message.error("Failed to load personnel options");
         }
      };

      fetchPersonnelOptions();

      // Fetch initial historical data
      handleSearch(); // Call handleSearch to fetch initial data
   }, []);

   const handleSearch = async () => {
      try {
         const queryParams = new URLSearchParams();
         console.log("==> ~ queryParams:", queryParams);
         console.log("==> ~ filters:", filters);
         if (filters?.personnelId) {
            queryParams.append("personnelId", (filters?.personnelId as number).toString());
         }
         if (filters?.name) {
            queryParams.append("name", filters.name);
         }
         if (filters?.dateRange && (filters.dateRange as dayjs.Dayjs[]).length === 2) {
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
         message.error("Failed to load historical data");
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
      // Implement your export logic here (e.g., generate CSV or Excel file)
      console.log("Exporting data:", historicalData);
   };

   const columns = [
      { title: "人员编号", dataIndex: "personnel_id", key: "personnel_id" },
      { title: "姓名", dataIndex: "name", key: "name" },
      { title: "心率", dataIndex: "heart_rate", key: "heart_rate" },
      { title: "呼吸", dataIndex: "breath_rate", key: "breath_rate" },
      { title: "距离", dataIndex: "target_distance", key: "target_distance" }, // Assuming 'distance' is 'target_distance' in the API response
      {
         title: "是否告警",
         dataIndex: "is_alarm", // Assuming 'isAlarm' is 'is_alarm' in the API response
         key: "is_alarm",
         render: (isAlarm: boolean) => (
            <span style={{ color: isAlarm ? "red" : "inherit" }}>{isAlarm ? "是" : "否"}</span>
         ),
      },
      {
         title: "日期时间",
         dataIndex: "update_date", // Todo: should be time!!
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
            onValuesChange={(changedValues, allValues) => setFilters(allValues)}
         >
            {" "}
            {/* 将 layout 改为 vertical */}
            <Row gutter={16}>
               {" "}
               {/* 添加 Row 来包裹筛选条件 */}
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
                     />
                  </Form.Item>
               </Col>
               <Col span={6}>
                  <Form.Item label='姓名' name='name'>
                     <Input placeholder='请输入姓名' />
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
               {" "}
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
               </Space>
            </Form.Item>
         </Form>

         <Table dataSource={historicalData} columns={columns} />
      </div>
   );
};

export default HistoryData;
