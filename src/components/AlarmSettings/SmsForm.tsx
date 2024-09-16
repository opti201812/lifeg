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
   const [availablePorts, setAvailablePorts] = useState<string[]>([]); // State to store available ports

   useEffect(() => {
      const fetchSmsConfig = async () => {
         try {
            const portsResponse = await axios.get(`${config.backend.url}/smsconfig/available-ports`); // 假设后端提供了 /available-ports 接口
            setAvailablePorts(portsResponse.data);
         } catch (error) {
            console.error("Error listing ports:", error);
            message.error("获取服务器端口列表失败！");
         }
      };

      fetchSmsConfig();
   }, []);

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
               if (key === "smsParity") {
                  values[key] = config.value;
               }
            });
            console.log("==> ~ values:", values);
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

         {showAdditionalFields && (
            <>
               <Row gutter={16}>
                  <Col span={12}>
                     <Form.Item label='端口号' name='smsPort'>
                        <Select>
                           {availablePorts.map((portOption) => (
                              <Select.Option key={portOption} value={portOption}>
                                 {portOption}
                              </Select.Option>
                           ))}
                        </Select>
                     </Form.Item>
                  </Col>
                  <Col span={12}>
                     <Form.Item label='波特率' name='smsBaudRate'>
                        <Select>
                           {[115200, 9600, 4800, 2400, 1200].map((baudRate) => (
                              <Select.Option key={baudRate} value={baudRate}>
                                 {baudRate}
                              </Select.Option>
                           ))}
                        </Select>
                     </Form.Item>
                  </Col>
               </Row>
               <Row gutter={16}>
                  <Col span={12}>
                     <Form.Item label='校验方式' name='smsParity'>
                        <Select>
                           {["NONE", "ODD", "EVEN"].map((parity) => (
                              <Select.Option key={parity} value={parity}>
                                 {parity}
                              </Select.Option>
                           ))}
                        </Select>
                     </Form.Item>
                  </Col>
                  <Col span={6}>
                     <Form.Item label='数据位' name='smsDataBits'>
                        <Select disabled>
                           <Select.Option value={8}>8</Select.Option>
                        </Select>
                     </Form.Item>
                  </Col>
                  <Col span={6}>
                     <Form.Item label='停止位' name='smsStopBits'>
                        <Select disabled>
                           <Select.Option value={1}>1</Select.Option>
                        </Select>
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
