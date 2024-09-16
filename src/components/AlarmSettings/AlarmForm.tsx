// components/AlarmSettings/AlarmForm.tsx

import React, { useState, useEffect } from "react";
import { Form, Input, Button, Switch, Upload, Row, Col, message, UploadFile, Tooltip, Select } from "antd";
import { UploadOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import axios, { AxiosError } from "axios"; // You'll need to install axios: `npm install axios`
import config from "../../config";

interface AlertConfig {
   config_name: string;
   value: string;
}
interface AlertConfigValue {
   collectPeriod: string; // In seconds
   savePeriod: string; // In seconds
   alertPeriod: string; // In seconds
   heartBeatUpper: string;
   heartBeatLower: string;
   breathUpper: string;
   breathLower: string;
   heartBeatRatioUpper: string; // In percentage
   heartBeatRatioLower: string; // In percentage
   breathRatioUpper: string; // In percentage
   breathRatioLower: string; // In percentage
   alertSound: string; // File path or URL
   flashEnabled: string; // 'true' or 'false'
}

const defaultAlertConfigValue: AlertConfigValue = {
   collectPeriod: "0",
   savePeriod: "0",
   alertPeriod: "0",
   heartBeatUpper: "0",
   heartBeatLower: "0",
   breathUpper: "0",
   breathLower: "0",
   heartBeatRatioUpper: "0",
   heartBeatRatioLower: "0",
   breathRatioUpper: "0",
   breathRatioLower: "0",
   alertSound: "",
   flashEnabled: "false",
};

const AlarmForm: React.FC = () => {
   const [form] = Form.useForm();
   const [initialValues, setInitialValues] = useState<AlertConfigValue>(defaultAlertConfigValue);
   const [fileList, setFileList] = useState<UploadFile[]>([]);
   const alarmSettingFields = [
      {
         label: "采集间隔",
         name: "collectPeriod",
         required: true,
         message: "请输入采集间隔",
         tooltip: "采集间隔时长范围: 100毫秒 ~ 5秒",
         min: 100,
         max: 5000,
         type: "number",
         unit: "毫秒",
      },
      {
         label: "保存间隔",
         name: "savePeriod",
         required: true,
         message: "请输入保存间隔",
         type: "number",
         min: 10,
         max: 300,
         tooltip: "保存间隔时长范围: 10秒 ~ 300秒, 必须是采集间隔的整数倍",
         unit: "秒",
      },
      {
         label: "报警间隔",
         name: "alertPeriod",
         required: true,
         message: "请输入报警间隔",
         type: "number",
         min: 0,
         max: 100,
         tooltip: "忽略最初的报警的次数",
         unit: "次",
      },
      {
         label: "心率上限值",
         name: "heartBeatUpper",
         required: true,
         message: "请输入心率上限值",
         type: "number",
         min: 80,
         max: 200,
         unit: "次/分",
      },
      {
         label: "心率下限值",
         name: "heartBeatLower",
         required: true,
         message: "请输入心率下限值",
         type: "number",
         min: 40,
         max: 120,
         unit: "次/分",
      },
      {
         label: "呼吸上限值",
         name: "breathUpper",
         required: true,
         message: "请输入呼吸上限值",
         type: "number",
         min: 20,
         max: 60,
         unit: "次/分",
      },
      {
         label: "呼吸下限值",
         name: "breathLower",
         required: true,
         message: "请输入呼吸下限值",
         type: "number",
         min: 10,
         max: 40,
         unit: "次/分",
      },
      {
         label: "心率上限比",
         name: "heartBeatRatioUpper",
         required: true,
         message: "请输入心率上限比",
         type: "number",
         min: 100,
         max: 200,
         unit: "%",
      },
      {
         label: "心率下限比",
         name: "heartBeatRatioLower",
         required: true,
         message: "请输入心率下限比",
         type: "number",
         min: 50,
         max: 100,
         unit: "%",
      },
      {
         label: "呼吸上限比",
         name: "breathRatioUpper",
         required: true,
         message: "请输入呼吸上限比",
         type: "number",
         min: 100,
         max: 200,
         unit: "%",
      },
      {
         label: "呼吸下限比",
         name: "breathRatioLower",
         required: true,
         message: "请输入呼吸下限比",
         type: "number",
         min: 50,
         max: 100,
         unit: "%",
      },
      { label: "报警声音", name: "alertSound", required: false, message: "请选择报警声音文件", type: "file" },
      { label: "是否闪灯", name: "flashEnabled", required: false, message: "", type: "boolean" },
   ];

   useEffect(() => {
      axios
         .get(`${config.backend.url}/alertconfig`)
         .then((res) => {
            const values: AlertConfigValue = { ...defaultAlertConfigValue };
            res.data.forEach((config: AlertConfig) => {
               const key = config.config_name as keyof AlertConfigValue; // Type assertion
               values[key] = config.value;
            });
            setInitialValues(values);
            form.setFieldsValue(values);
         })
         .catch((err) => {
            console.error("Error fetching alert configs:", err);
            message.error("加载配置信息失败！");
         });
   }, []);

   const handleUploadChange = (info: any) => {
      let fileList = [...info.fileList];

      // 1. Limit the number of uploaded files
      fileList = fileList.slice(-1); // Keep only the last uploaded file

      setFileList(fileList);

      // You'll need to handle the actual file upload to your backend here
      if (info.file.status === "done") {
         // Handle successful upload and update alertSound value
         const url = info.file.response.url; // Assuming your backend returns the file URL
         form.setFieldsValue({ alertSound: url });
      } else if (info.file.status === "error") {
         message.error(`${info.file.name} file upload failed.`);
      }
   };

   const handleFinish = async (values: AlertConfigValue) => {
      try {
         const changedValues = Object.keys(values).reduce((acc, key) => {
            const typedKey = key as keyof AlertConfigValue;
            if (values[typedKey] !== initialValues[typedKey]) {
               acc[typedKey] = values[typedKey];
            }
            return acc;
         }, {} as Partial<AlertConfigValue>);

         // 一次性发送所有更新后的配置数据
         await axios.put(`${config.backend.url}/alertconfig`, changedValues);
         // Save alertSound to localStorage
         localStorage.setItem("alertSound", values.alertSound);
         message.success("保存配置信息成功！");
      } catch (err: unknown) {
         // Use unknown type for err
         if (axios.isAxiosError(err)) {
            // Check if err is an AxiosError
            console.warn(err.response?.data?.error || err); // Now you can access err.response
         } else {
            console.error(err);
         }
         message.error("保存配置信息失败！");
      }
   };

   return (
      <Form form={form} name='alarm-settings' onFinish={handleFinish} initialValues={initialValues}>
         <Row gutter={16}>
            {alarmSettingFields?.map((field, index) => (
               <Col span={index < 3 ? 8 : 12} key={field.name}>
                  <Form.Item
                     label={
                        field.tooltip ? (
                           <Tooltip title={field.tooltip}>
                              {field.label} <QuestionCircleOutlined />
                           </Tooltip>
                        ) : (
                           field.label
                        )
                     }
                     name={field.name}
                     rules={[{ required: field.required, message: field.message }]}
                     valuePropName={field.type === "file" ? "fileList" : "value"} // Use valuePropName for Upload
                  >
                     {field.type === "number" && (
                        <Input type='number' addonAfter={field.unit} min={field.min} max={field.max} />
                     )}
                     {field.type === "file" && ( // Replace file upload with Select
                        <Select
                           placeholder='请选择报警声音'
                           options={[
                              { value: "alarm_001.mp3", label: "报警声音1" },
                              { value: "alarm_002.mp3", label: "报警声音2" },
                           ]}
                        />
                     )}
                     {field.type === "boolean" && <Switch />}
                  </Form.Item>
               </Col>
            ))}
         </Row>
         <Form.Item wrapperCol={{ span: 24 }}>
            {" "}
            {/* Make the button full width */}
            <Button type='primary' htmlType='submit'>
               保存设置
            </Button>
         </Form.Item>
      </Form>
   );
};

export default AlarmForm;
