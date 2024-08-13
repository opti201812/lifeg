import React, { useState, useEffect } from "react";
import { Table, Button, Input, DatePicker, Select, Space, message, Form, Row, Col } from "antd";
import { SearchOutlined, ReloadOutlined, DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import config from "../../config";

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

      // Fetch initial alarm data
      handleSearch();
   }, []);

   const handleSearch = async () => {
      try {
         const queryParams = new URLSearchParams();
         if (filters.personnelId !== null) {
            queryParams.append("personnelId", (filters.personnelId as number).toString());
         }
         if (filters.name) {
            queryParams.append("name", filters.name);
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

         const response = await axios.get(`${config.backend.url}/history/alarms?${queryParams.toString()}`); // 假设后端接口为 /history/alarms
         setAlarmData(response.data || []);
      } catch (error) {
         console.error("Error fetching alarm data:", error);
         message.error("Failed to load alarm data");
      }
   };

   const handleReset = () => {
      setFilters({
         personnelId: null,
         name: "",
         dateRange: null,
         alarmLevel: null,
         handlingTimeRange: null, // 新增：重置处理时间筛选
      });
   };

   const handleExport = () => {
      // Implement your export logic here (e.g., generate CSV or Excel file)
      console.log("Exporting data:", alarmData);
   };

   const columns = [
      { title: "人员编号", dataIndex: "personnel_id", key: "personnelId" },
      { title: "姓名", dataIndex: "name", key: "name" },
      { title: "心率", dataIndex: "heart_rate", key: "heartRate" },
      { title: "呼吸", dataIndex: "breath_rate", key: "breathRate" },
      { title: "距离", dataIndex: "distance", key: "distance" },
      { title: "告警级别", dataIndex: "alarm_level", key: "alarmLevel" }, // 修改：告警级别
      { title: "处理方法", dataIndex: "handling_method", key: "handlingMethod" }, // 新增：处理方法
      {
         title: "处理时间",
         dataIndex: "handling_time",
         key: "handlingTime",
         render: (handlingTime: string) => (handlingTime ? dayjs(handlingTime).format("YYYY-MM-DD HH:mm:ss") : ""), // 格式化处理时间
      },
      {
         title: "告警时间",
         dataIndex: "create_date",
         key: "dateTime",
         render: (dateTime: string) => dayjs(dateTime).format("YYYY-MM-DD HH:mm:ss"),
      },
   ];

   return (
      <div>
         <h2>告警信息</h2>
         <Form layout='vertical' onFinish={handleSearch}>
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
                     />
                  </Form.Item>
               </Col>
               <Col span={5}>
                  <Form.Item label='姓名' name='name'>
                     <Input placeholder='请输入姓名' />
                  </Form.Item>
               </Col>
               <Col span={5}>
                  <Form.Item label='告警级别' name='alarmLevel'>
                     {" "}
                     {/* 修改：告警级别筛选 */}
                     <Select allowClear placeholder='请选择'>
                        <Select.Option value='low'>低</Select.Option>
                        <Select.Option value='medium'>中</Select.Option>
                        <Select.Option value='high'>高</Select.Option>
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

         <Table dataSource={alarmData} columns={columns} />
      </div>
   );
};

export default AlarmDisplay;
