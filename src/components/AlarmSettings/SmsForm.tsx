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
   const [fileList, setFileList] = useState<UploadFile[]>([]);
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
               if (key === "smsVerificationCodeExpiry" || key === "smsBaudRate") {
                  values[key] = parseInt(config.value, 10) || 0;
               }
               if (key === "smsPort") {
                  values[key] = config.value;
               }
            });
            setInitialValues(values);
            form.setFieldsValue(values);
         } catch (error) {
            console.error("Error fetching SMS config:", error);
            message.error("Failed to load SMS settings");
         }
      };

      fetchSmsConfig();
   }, []);

   useEffect(() => {
      setShowAdditionalFields(initialValues.smsEnabled); // Update showAdditionalFields state when initialValues change
   }, [initialValues.smsEnabled]);

   const handleFinish = async (values: SmsConfig) => {
      console.log("==> ~ values:", values);
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
            message.error(err.response?.data?.error || "Failed to save SMS settings");
         } else {
            message.error("Failed to save SMS settings");
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

         {showAdditionalFields && (
            <>
               <Row gutter={16}>
                  <Col span={12}>
                     <Form.Item label='端口号' name='smsPort'>
                        <Select>
                           {["USB1", "USB2", "USB3", "COM1", "COM2"].map((portOption) => (
                              <Select.Option key={portOption} value={portOption}>
                                 {portOption}
                              </Select.Option>
                           ))}
                        </Select>
                     </Form.Item>
                  </Col>
                  <Col span={12}>
                     <Form.Item label='波特率' name='smsBaudRate'>
                        <Input type='number' />
                     </Form.Item>
                  </Col>
               </Row>
            </>
         )}
         <Form.Item wrapperCol={{ span: 24 }}>
            <Button type='primary' htmlType='submit'>
               保存设置
            </Button>
         </Form.Item>
      </Form>
   );
};

export default SmsForm;
