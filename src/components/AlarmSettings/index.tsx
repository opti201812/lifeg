import React from "react";
import { Form, Input, Button, Switch, Upload, Row, Col } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const AlarmSettings: React.FC = () => {
   const handleFinish = (values: any) => {
      console.log("表单数据: ", values);
   };

   return (
      <div>
         <h2>告警设置</h2>
         <Form
            name='alarm-settings'
            onFinish={handleFinish}
            initialValues={{
               heartRateUpperLimit: 100,
               heartRateLowerLimit: 60,
               breathRateUpperLimit: 20,
               breathRateLowerLimit: 12,
               heartRateUpperRatio: 90,
               heartRateLowerRatio: 70,
               breathRateUpperRatio: 80,
               breathRateLowerRatio: 60,
               alarmSound: null,
               flashLight: false,
            }}
         >
            <Row gutter={16}>
               <Col span={12}>
                  <Form.Item
                     label='心率上限值'
                     name='heartRateUpperLimit'
                     rules={[{ required: true, message: "请输入心率上限值" }]}
                  >
                     <Input type='number' />
                  </Form.Item>
               </Col>
               <Col span={12}>
                  <Form.Item
                     label='心率下限值'
                     name='heartRateLowerLimit'
                     rules={[{ required: true, message: "请输入心率下限值" }]}
                  >
                     <Input type='number' />
                  </Form.Item>
               </Col>
            </Row>
            <Row gutter={16}>
               <Col span={12}>
                  <Form.Item
                     label='呼吸上限值'
                     name='breathRateUpperLimit'
                     rules={[{ required: true, message: "请输入呼吸上限值" }]}
                  >
                     <Input type='number' />
                  </Form.Item>
               </Col>
               <Col span={12}>
                  <Form.Item
                     label='呼吸下限值'
                     name='breathRateLowerLimit'
                     rules={[{ required: true, message: "请输入呼吸下限值" }]}
                  >
                     <Input type='number' />
                  </Form.Item>
               </Col>
            </Row>
            <Row gutter={16}>
               <Col span={12}>
                  <Form.Item
                     label='心率上限比'
                     name='heartRateUpperRatio'
                     rules={[{ required: true, message: "请输入心率上限比" }]}
                  >
                     <Input type='number' addonAfter='%' />
                  </Form.Item>
               </Col>
               <Col span={12}>
                  <Form.Item
                     label='心率下限比'
                     name='heartRateLowerRatio'
                     rules={[{ required: true, message: "请输入心率下限比" }]}
                  >
                     <Input type='number' addonAfter='%' />
                  </Form.Item>
               </Col>
            </Row>
            <Row gutter={16}>
               <Col span={12}>
                  <Form.Item
                     label='呼吸上限比'
                     name='breathRateUpperRatio'
                     rules={[{ required: true, message: "请输入呼吸上限比" }]}
                  >
                     <Input type='number' addonAfter='%' />
                  </Form.Item>
               </Col>
               <Col span={12}>
                  <Form.Item
                     label='呼吸下限比'
                     name='breathRateLowerRatio'
                     rules={[{ required: true, message: "请输入呼吸下限比" }]}
                  >
                     <Input type='number' addonAfter='%' />
                  </Form.Item>
               </Col>
            </Row>
            <Row gutter={16}>
               <Col span={12}>
                  <Form.Item
                     label='报警声音'
                     name='alarmSound'
                     valuePropName='fileList'
                     getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
                  >
                     <Upload name='file' beforeUpload={() => false}>
                        <Button icon={<UploadOutlined />}>上传报警声音</Button>
                     </Upload>
                  </Form.Item>
               </Col>
               <Col span={12}>
                  <Form.Item label='是否闪灯' name='flashLight' valuePropName='checked'>
                     <Switch />
                  </Form.Item>
               </Col>
            </Row>
            <Form.Item>
               <Button type='primary' htmlType='submit'>
                  保存设置
               </Button>
            </Form.Item>
         </Form>
      </div>
   );
};

export default AlarmSettings;
