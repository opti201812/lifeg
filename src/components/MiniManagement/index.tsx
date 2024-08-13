// components/MiniManagement/index.tsx
import React, { useState, useEffect } from "react";
import { Form, Input, Button, Switch, Upload, Row, Col, message, UploadFile, Tooltip, Select } from "antd";
import { UploadOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import axios, { AxiosError } from "axios"; // You'll need to install axios: `npm install axios`
import config from "../../config";

interface Config {
   config_name: string;
   value: string | boolean;
}

interface MiniConfig {
   isEnabled: boolean;
   provider: string;
   accountSid: string;
   authToken: string;
   fromNumber: string;
   defaultMessage: string;
   verificationCodeValidity: number;
   port: string;
   baudRate: number;
}

const defaultMiniConfig: MiniConfig = {
   isEnabled: true,
   provider: "",
   accountSid: "",
   authToken: "",
   fromNumber: "",
   defaultMessage: "",
   verificationCodeValidity: 120,
   port: "USB1",
   baudRate: 9600,
};

const MiniManagement: React.FC = () => {
   const [form] = Form.useForm();
   const [initialValues, setInitialValues] = useState<MiniConfig>(defaultMiniConfig);
   const [fileList, setFileList] = useState<UploadFile[]>([]);
   const [showAdditionalFields, setShowAdditionalFields] = useState(initialValues.isEnabled); // State to control visibility

   const handleUploadChange = (info: any) => {
      // ... (rest of the handleUploadChange function)
   };

   const handleFinish = async (values: MiniConfig) => {
      // ... (rest of the handleFinish function)
   };

   const handleIsEnabledChange = (value: boolean) => {
      setShowAdditionalFields(value); // Update showAdditionalFields state
   };

   return (
      <div style={{ marginLeft: "5%", marginRight: "5%" }}>
         <h2>小程序管理</h2>
         <Form form={form} name='sms-management' onFinish={handleFinish} initialValues={initialValues}>
            <Row gutter={16}>
               <Col span={12}>
                  <Form.Item
                     label='是否启用'
                     name='isEnabled'
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
                        name='verificationCodeValidity'
                        rules={[{ required: true, message: "请输入验证码有效期" }]}
                     >
                        <Input type='number' addonAfter='秒' />
                     </Form.Item>
                  </Col>
               )}
            </Row>

            {/* Conditionally render additional fields based on showAdditionalFields state */}
            {showAdditionalFields && (
               <>
                  <Row gutter={16}>
                     <Col span={12}>
                        <Form.Item label='端口号' name='port'>
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
                        <Form.Item label='波特率' name='baudRate'>
                           <Input type='number' />
                        </Form.Item>
                     </Col>
                  </Row>

                  <Form.Item wrapperCol={{ span: 24 }}>
                     <Button type='primary' htmlType='submit'>
                        保存设置
                     </Button>
                  </Form.Item>
               </>
            )}
         </Form>
      </div>
   );
};

export default MiniManagement;
