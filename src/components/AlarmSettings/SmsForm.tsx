import React, { useState, useEffect } from "react";
import { Form, Input, Button, Switch, Row, Col, message, Select, UploadFile } from "antd";
import axios from "axios";
import config from "../../config";
import { AlertConfig, defaultSmsConfig, SmsConfig } from "../../types";

interface SmsFormProps {
   initialValues: SmsConfig;
}

const SmsForm: React.FC<SmsFormProps> = ({}) => {
   const [form] = Form.useForm();
   const [initialValues, setInitialValues] = useState<SmsConfig>(defaultSmsConfig);
   const [showAdditionalFields, setShowAdditionalFields] = useState(initialValues.smsEnabled); // State to control visibility

   useEffect(() => {
      const fetchSmsConfig = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/smsconfig`);
            const values: SmsConfig = { ...defaultSmsConfig }; // Initialize with defaults

            response.data.forEach((config: AlertConfig) => {
               const key = config.config_name as keyof SmsConfig; // Use keyof to ensure type safety
               if (key === "smsEnabled") {
                  values[key] = config.value === "true"; // Convert string to boolean for smsEnabled
               }
               // Handle numerical values
               if (key === "smsVerificationCodeExpiry") {
                  values[key] = parseInt(config.value as string, 10) || 0;
               }
            });
            setInitialValues(values);
            form.setFieldsValue(values);
         } catch (error) {
            console.error("Error fetching SMS config:", error);
            message.error("加载短信设置失败！");
         }
      };

      fetchSmsConfig();
   }, []);

   useEffect(() => {
      setShowAdditionalFields(initialValues.smsEnabled); // Update showAdditionalFields state when initialValues change
   }, [initialValues.smsEnabled]);

   const handleFinish = async (values: SmsConfig) => {
      // Use the updated SmsConfig type
      try {
         // Convert boolean to string for API compatibility
         const updatedValues: Record<string, string> = {};
         for (const [key, value] of Object.entries(values)) {
            if (value !== undefined)
               updatedValues[key] = typeof value === "boolean" ? value.toString() : value.toString();
         }

         await axios.put(`${config.backend.url}/smsconfig`, updatedValues);
         message.success("SMS settings saved successfully");
      } catch (err) {
         console.error("Error saving SMS settings:", err);
         if (axios.isAxiosError(err)) {
            message.error(err.response?.data?.error || "保存短信设置失败！");
         } else {
            message.error("保存短信设置失败！");
         }
      }
   };
   const handleIsEnabledChange = (value: boolean) => {
      setShowAdditionalFields(value); // Update showAdditionalFields state
   };

   return (
      <Form form={form} name='sms-management' onFinish={handleFinish} initialValues={initialValues}>
         <Row gutter={16}>
            <Col span={12}>
               <Form.Item
                  label='是否启用'
                  name='smsEnabled'
                  valuePropName='checked'
                  rules={[{ required: true, message: "请选择是否启用短信通知" }]}
               >
                  <Switch
                     onChange={handleIsEnabledChange} // Add onChange handler
                  />
               </Form.Item>
            </Col>
            {showAdditionalFields && (
               <Col span={12}>
                  <Form.Item
                     label='验证码有效时长'
                     name='smsVerificationCodeExpiry'
                     rules={[{ required: true, message: "请输入验证码有效期" }]}
                  >
                     <Input type='number' addonAfter='秒' />
                  </Form.Item>
               </Col>
            )}
         </Row>
         <Form.Item wrapperCol={{ span: 24 }}>
            <Button type='primary' htmlType='submit'>
               保存设置
            </Button>
         </Form.Item>
      </Form>
   );
};

export default SmsForm;
