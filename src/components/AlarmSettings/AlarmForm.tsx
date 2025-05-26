// components/AlarmSettings/AlarmForm.tsx

import React, { useState, useEffect } from "react";
import { Form, Input, Button, Switch, Upload, Row, Col, message, UploadFile, Tooltip, Select } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import axios from "axios"; // You'll need to install axios: `npm install axios`
import config from "../../config";

interface AlertConfig {
   config_name: string;
   value: string;
}
interface AlertConfigValue {
   collectPeriod: string; // In seconds
   savePeriod: string; // In seconds
   saveRetention: string; // 新增保存时长字段
   alertPeriod: string; // In seconds
   heartBeatUpper: string;
   heartBeatLower: string;
   breathUpper: string;
   breathLower: string;
   heartBeatRatioUpper: string; // In percentage
   heartBeatRatioLower: string; // In percentage
   breathRatioUpper: string; // In percentage
   breathRatioLower: string; // In percentage
   restHeartBeatRatioLower: string; // 修改字段名
   restBreathRatioLower: string; // 修改字段名
   alertSound: string; // File path or URL
   flashEnabled: string; // 'true' or 'false'
}

const defaultAlertConfigValue: AlertConfigValue = {
   collectPeriod: "0",
   savePeriod: "0",
   saveRetention: "3", // 默认3天
   alertPeriod: "0",
   heartBeatUpper: "0",
   heartBeatLower: "0",
   breathUpper: "0",
   breathLower: "0",
   heartBeatRatioUpper: "0",
   heartBeatRatioLower: "0",
   breathRatioUpper: "0",
   breathRatioLower: "0",
   restHeartBeatRatioLower: "40", // 修改字段名
   restBreathRatioLower: "40", // 修改字段名
   alertSound: "",
   flashEnabled: "false",
};

const AlarmForm: React.FC = () => {
   const [form] = Form.useForm();
   const [initialValues, setInitialValues] = useState<AlertConfigValue>(defaultAlertConfigValue);
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
         span: 6, // 第一行4项，每项占6列 (24/4=6)
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
         span: 6,
      },
      {
         label: "保存间隔",
         name: "savePeriod",
         required: true,
         message: "请输入保存间隔",
         type: "number",
         min: 15,
         max: 300,
         tooltip: "保存间隔时长范围: 15秒 ~ 300秒, 必须是15秒的整数倍",
         unit: "秒",
         validator: (rule: any, value: number) => {
            if (value % 15 !== 0) {
               return Promise.reject("保存间隔必须是15秒的整数倍");
            }
            return Promise.resolve();
         },
         span: 6,
      },
      {
         label: "保存时长",
         name: "saveRetention",
         required: true,
         message: "请选择保存时长",
         type: "select",
         options: [
            { value: "3", label: "3天" },
            { value: "5", label: "5天" },
            { value: "7", label: "7天" },
         ],
         span: 6,
      },
      // 心率相关配置 - 每行3项
      {
         label: "心率上限比",
         name: "heartBeatRatioUpper",
         required: true,
         message: "请输入心率上限比",
         type: "number",
         min: 100,
         max: 200,
         unit: "%",
         span: 8, // 每行3项，每项占8列 (24/3=8)
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
         span: 8,
      },
      {
         label: "静息心率下限比",
         name: "restHeartBeatRatioLower", // 修改字段名
         required: true,
         message: "请输入静息心率下限比",
         type: "number",
         min: 40,
         max: 65,
         unit: "%",
         validator: (rule: any, value: number, callback: any) => {
            const heartBeatLower = form.getFieldValue("heartBeatRatioLower");
            if (value >= heartBeatLower) {
               return Promise.reject("静息心率下限比必须小于心率下限比");
            }
            return Promise.resolve();
         },
         span: 8,
      },
      // 呼吸相关配置 - 每行3项
      {
         label: "呼吸上限比",
         name: "breathRatioUpper",
         required: true,
         message: "请输入呼吸上限比",
         type: "number",
         min: 100,
         max: 200,
         unit: "%",
         span: 8,
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
         span: 8,
      },
      {
         label: "静息呼吸下限比",
         name: "restBreathRatioLower", // 修改字段名
         required: true,
         message: "请输入静息呼吸率下限比",
         type: "number",
         min: 40,
         max: 60,
         unit: "%",
         validator: (rule: any, value: number, callback: any) => {
            const breathLower = form.getFieldValue("breathRatioLower");
            if (value >= breathLower) {
               return Promise.reject("静息呼吸率下限比必须小于呼吸下限比");
            }
            return Promise.resolve();
         },
         span: 8,
      },
      // 其他配置
      {
         label: "报警声音",
         name: "alertSound",
         required: false,
         message: "请选择报警声音文件",
         type: "file",
         span: 12, // 其他项占12列
      },
      {
         label: "是否闪灯",
         name: "flashEnabled",
         required: false,
         message: "",
         type: "boolean",
         span: 6,
      },
      {
         label: "房间内是否显示姓名",
         name: "isPersonNameVisible",
         required: false,
         message: "",
         type: "boolean",
         span: 6,
      },
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
               <Col span={field.span || 24} key={field.name}>
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
                     rules={[
                        ...(field.required ? [{ required: true, message: field.message }] : []),
                        ...(field.validator ? [{ validator: field.validator }] : []),
                     ].filter(Boolean)}
                     valuePropName={field.type === "file" ? "fileList" : "value"}
                  >
                     {field.type === "number" && (
                        <Input type='number' addonAfter={field.unit} min={field.min} max={field.max} />
                     )}
                     {field.type === "select" && (
                        <Select placeholder={`请选择${field.label}`} options={field.options} />
                     )}
                     {field.type === "file" && (
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
            <Button type='primary' htmlType='submit'>
               保存设置
            </Button>
         </Form.Item>
      </Form>
   );
};

export default AlarmForm;
