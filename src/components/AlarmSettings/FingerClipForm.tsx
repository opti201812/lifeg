import React, { useState, useEffect } from "react";
import { Form, Select, Button, message, Row, Col } from "antd";
import axios from "axios";
import config from "../../config";

interface FingerClipConfig {
   config_name: string;
   value: string;
}

interface FingerClipConfigValue {
   fingerClipPort: string; // 指夹仪串口
   fingerClipBaudRate: string; // 波特率
   fingerClipEnabled: string; // 是否启用
}

const defaultFingerClipConfigValue: FingerClipConfigValue = {
   fingerClipPort: "",
   fingerClipBaudRate: "9600",
   fingerClipEnabled: "false",
};

const FingerClipForm: React.FC = () => {
   const [form] = Form.useForm();
   const [initialValues, setInitialValues] = useState<FingerClipConfigValue>(defaultFingerClipConfigValue);
   const [availablePorts, setAvailablePorts] = useState<string[]>([]);

   useEffect(() => {
      const fetchFingerClipConfig = async () => {
         try {
            // TODO: 调用获取指夹仪配置的API
            const response = await axios.get(`${config.backend.url}/fingerclipconfig`);
            const values: FingerClipConfigValue = { ...defaultFingerClipConfigValue };

            response.data.forEach((config: FingerClipConfig) => {
               const key = config.config_name as keyof FingerClipConfigValue;
               values[key] = config.value;
            });

            setInitialValues(values);
            form.setFieldsValue(values);
         } catch (error) {
            console.error("Error fetching finger clip config:", error);
            message.error("加载指夹仪配置失败！");
         }
      };

      const fetchAvailablePorts = async () => {
         try {
            // TODO: 调用获取可用串口的API
            const response = await axios.get(`${config.backend.url}/serial/ports`);
            setAvailablePorts(response.data || []);
         } catch (error) {
            console.error("Error fetching available ports:", error);
            // 如果API不可用，使用默认端口列表
            setAvailablePorts(["COM1", "COM2", "COM3", "COM4", "COM5", "COM6"]);
         }
      };

      fetchFingerClipConfig();
      fetchAvailablePorts();
   }, []);

   const handleFinish = async (values: FingerClipConfigValue) => {
      try {
         const changedValues = Object.keys(values).reduce((acc, key) => {
            const typedKey = key as keyof FingerClipConfigValue;
            if (values[typedKey] !== initialValues[typedKey]) {
               acc[typedKey] = values[typedKey];
            }
            return acc;
         }, {} as Partial<FingerClipConfigValue>);

         // TODO: 调用保存指夹仪配置的API
         await axios.put(`${config.backend.url}/fingerclipconfig`, changedValues);
         message.success("指夹仪配置保存成功！");
      } catch (error) {
         console.error("Error saving finger clip config:", error);
         message.error("保存指夹仪配置失败！");
      }
   };

   const baudRateOptions = [
      { value: "9600", label: "9600" },
      { value: "19200", label: "19200" },
      { value: "38400", label: "38400" },
      { value: "57600", label: "57600" },
      { value: "115200", label: "115200" },
   ];

   return (
      <Form form={form} name='fingerclip-settings' onFinish={handleFinish} initialValues={initialValues}>
         <Row gutter={16}>
            <Col span={12}>
               <Form.Item
                  label='是否启用指夹仪'
                  name='fingerClipEnabled'
                  valuePropName='checked'
                  rules={[{ required: true, message: "请选择是否启用指夹仪" }]}
               >
                  <Select placeholder='请选择是否启用'>
                     <Select.Option value='true'>启用</Select.Option>
                     <Select.Option value='false'>禁用</Select.Option>
                  </Select>
               </Form.Item>
            </Col>
         </Row>

         <Row gutter={16}>
            <Col span={12}>
               <Form.Item
                  label='串口选择'
                  name='fingerClipPort'
                  rules={[{ required: true, message: "请选择指夹仪串口" }]}
               >
                  <Select placeholder='请选择串口'>
                     {availablePorts.map((port) => (
                        <Select.Option key={port} value={port}>
                           {port}
                        </Select.Option>
                     ))}
                  </Select>
               </Form.Item>
            </Col>
            <Col span={12}>
               <Form.Item
                  label='波特率'
                  name='fingerClipBaudRate'
                  rules={[{ required: true, message: "请选择波特率" }]}
               >
                  <Select placeholder='请选择波特率' options={baudRateOptions} />
               </Form.Item>
            </Col>
         </Row>

         <Form.Item wrapperCol={{ span: 24 }}>
            <Button type='primary' htmlType='submit'>
               保存设置
            </Button>
         </Form.Item>
      </Form>
   );
};

export default FingerClipForm;
