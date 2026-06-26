import React from "react";
import { Form, Input, Select, Row, Col, Button, Divider, Space } from "antd";
import { FormInstance } from "antd";
import { MEDICAL_HISTORIES } from "../../../types";

const { Option } = Select;

interface RegistrationFormProps {
   form: FormInstance;
   availableBracelets: string[];
   oximeterEnabled: boolean;
   onOximeterToggle: () => void;
   onCancel: () => void;
   onSubmit: (values: any) => void;
   loading: boolean;
   isEditing: boolean;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({
   form,
   availableBracelets,
   oximeterEnabled,
   onOximeterToggle,
   onCancel,
   onSubmit,
   loading,
   isEditing,
}) => {
   return (
      <Form form={form} layout='vertical' onFinish={onSubmit}>
         {/* 人员基础信息 */}
         <Divider orientation='left'>人员基础信息</Divider>
         <Row gutter={16}>
            <Col span={8}>
               <Form.Item label='姓名' name='name' rules={[{ required: true, message: "请输入姓名" }]}>
                  <Input placeholder='请输入姓名' />
               </Form.Item>
            </Col>
            <Col span={8}>
               <Form.Item
                  label='身份证号'
                  name='idNumber'
                  rules={[
                     { required: true, message: "请输入身份证号" },
                     { pattern: /^\d{17}[\dXx]$/, message: "请输入有效的身份证号" },
                  ]}
               >
                  <Input placeholder='请输入身份证号' />
               </Form.Item>
            </Col>
            <Col span={4}>
               <Form.Item label='性别' name='gender' rules={[{ required: true, message: "请选择性别" }]}>
                  <Select placeholder='请选择性别'>
                     <Option value='male'>男</Option>
                     <Option value='female'>女</Option>
                  </Select>
               </Form.Item>
            </Col>
            <Col span={4}>
               <Form.Item label='年龄' name='age' rules={[{ required: true, message: "请输入年龄" }]}>
                  <Input type='number' placeholder='年龄' min={1} max={120} />
               </Form.Item>
            </Col>
         </Row>

         <Row gutter={16}>
            <Col span={12}>
               <Form.Item label='既往病史' name='medicalHistory'>
                  <Select placeholder='请选择既往病史'>
                     {MEDICAL_HISTORIES.map((item) => (
                        <Option key={item.value} value={item.value}>
                           {item.label}
                        </Option>
                     ))}
                  </Select>
               </Form.Item>
            </Col>
            <Col span={12}>
               <Form.Item label='备注' name='remarks'>
                  <Input.TextArea rows={3} placeholder='请输入备注信息' />
               </Form.Item>
            </Col>
         </Row>

         {/* 血氧仪编号（仅当启用血氧仪时显示） */}
         {oximeterEnabled && (
            <Row gutter={16}>
               <Col span={12}>
                  <Form.Item
                     label='血氧仪编号'
                     name='oximeterId'
                     rules={[{ required: true, message: "请输入血氧仪编号" }]}
                  >
                     <Input placeholder='请输入血氧仪编号' />
                  </Form.Item>
               </Col>
            </Row>
         )}

         {/* 设备分配 */}
         <Divider orientation='left'>设备分配</Divider>
         <Row gutter={16}>
            <Col span={12}>
               <Form.Item label='手环选择' name='braceletId'>
                  <Select placeholder='请选择手环（可选）' allowClear showSearch>
                     {availableBracelets.map((bracelet) => (
                        <Option key={bracelet} value={bracelet}>
                           {bracelet}
                        </Option>
                     ))}
                  </Select>
               </Form.Item>
            </Col>
            <Col span={12}>
               <Form.Item label='血氧仪'>
                  <Button
                     type={oximeterEnabled ? "default" : "primary"}
                     danger={oximeterEnabled}
                     onClick={onOximeterToggle}
                  >
                     {oximeterEnabled ? "断开血氧仪" : "连接血氧仪"}
                  </Button>
               </Form.Item>
            </Col>
         </Row>

         {/* 生命体征数据采集 */}
         <Divider orientation='left'>生命体征数据采集</Divider>
         <Row gutter={16}>
            <Col span={6}>
               <Form.Item
                  label='当前心率 (bpm)'
                  name='heartRate'
                  rules={[{ required: true, message: "请输入心率" }]}
               >
                  <Input type='number' placeholder='心率' />
               </Form.Item>
            </Col>
            <Col span={6}>
               <Form.Item
                  label='当前呼吸率 (rpm)'
                  name='breathRate'
                  rules={[{ required: true, message: "请输入呼吸率" }]}
               >
                  <Input type='number' placeholder='呼吸率' />
               </Form.Item>
            </Col>
            <Col span={6}>
               <Form.Item
                  label='静息心率 (bpm)'
                  name='restingHeartRate'
                  rules={[{ required: true, message: "请输入静息心率" }]}
               >
                  <Input type='number' placeholder='静息心率' />
               </Form.Item>
            </Col>
            <Col span={6}>
               <Form.Item
                  label='静息呼吸率 (rpm)'
                  name='restingBreathRate'
                  rules={[{ required: true, message: "请输入静息呼吸率" }]}
               >
                  <Input type='number' placeholder='静息呼吸率' />
               </Form.Item>
            </Col>
         </Row>

         {/* 血氧仪相关指标（仅当启用血氧仪时显示） */}
         {oximeterEnabled && (
            <Row gutter={16}>
               <Col span={6}>
                  <Form.Item label='血氧饱和度 (%)' name='spo2'>
                     <Input type='number' placeholder='血氧' step='0.1' />
                  </Form.Item>
               </Col>
               <Col span={6}>
                  <Form.Item label='体温 (℃)' name='bodyTemperature'>
                     <Input type='number' placeholder='体温' step='0.1' />
                  </Form.Item>
               </Col>
               <Col span={6}>
                  <Form.Item label='血压 (收缩压)' name='systolicPressure'>
                     <Input type='number' placeholder='收缩压' />
                  </Form.Item>
               </Col>
               <Col span={6}>
                  <Form.Item label='血压 (舒张压)' name='diastolicPressure'>
                     <Input type='number' placeholder='舒张压' />
                  </Form.Item>
               </Col>
            </Row>
         )}

         {/* 表单操作按钮 */}
         <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space>
               <Button onClick={onCancel}>取消</Button>
               <Button type='primary' htmlType='submit' loading={loading}>
                  {isEditing ? "更新" : "提交"}
               </Button>
            </Space>
         </Form.Item>
      </Form>
   );
};

export default RegistrationForm;

