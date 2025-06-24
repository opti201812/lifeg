// components/PersonnelManagement/BasicInfoForm.tsx
import React from "react";
import { Col, Divider, Form, Input, Row, Select } from "antd";
import { MEDICAL_HISTORIES, Personnel, Room } from "../../types";

interface BasicInfoFormProps {
   form: any; // You might need to replace 'any' with the actual type of your form instance
   editingPersonnel: Personnel | null;
}

const createFormItem = (label: string, name: string[], addonAfter: string, enabled = false) => (
   <Col span={6}>
      <Form.Item label={label} name={name}>
         <Input type='number' disabled={!enabled} addonAfter={addonAfter} />
      </Form.Item>
   </Col>
);

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ form, editingPersonnel }) => {
   return (
      <>
         <Form.Item
            name={["id"]}
            label='人员编号'
            rules={[{ required: false, message: "请输入编号" }]}
            style={{ display: "none" }}
         >
            <Input />
         </Form.Item>

         <Row gutter={16}>
            <Col span={12}>
               <Form.Item
                  label='姓名'
                  name={["name"]}
                  rules={[{ required: true, message: "请输入姓名" }]}
                  wrapperCol={{ span: 24 }} // Add this line to each Form.Item
               >
                  <Input />
               </Form.Item>
            </Col>
            <Col span={12}>
               <Form.Item
                  label='身份证号码'
                  name={["id_number"]}
                  rules={[{ required: true, message: "请输入身份证号码" }]}
                  wrapperCol={{ span: 24 }} // Add this line to each Form.Item
               >
                  <Input />
               </Form.Item>
            </Col>
         </Row>

         <Row gutter={16}>
            <Col span={12}>
               <Form.Item label='性别' name={["gender"]}>
                  <Select placeholder='请选择性别' allowClear>
                     <Select.Option value='male'>男</Select.Option>
                     <Select.Option value='female'>女</Select.Option>
                  </Select>
               </Form.Item>
            </Col>
            <Col span={12}>
               <Form.Item label='年龄' name={["age"]} rules={[{ required: true, message: "请输入年龄" }]}>
                  <Input type='number' />
               </Form.Item>
            </Col>
         </Row>
         <Row gutter={0}>
            <Col span={12}>
               <Form.Item label='职业' name={["occupation"]} rules={[{ required: false, message: "请输入职业" }]}>
                  <Input />
               </Form.Item>
            </Col>
            <Col span={12}>
               <Form.Item label='是否已离场' name={["is_out"]} rules={[{ required: false, message: "请选择" }]}>
                  <Select placeholder='请选择' allowClear>
                     <Select.Option value='false'>在场</Select.Option>
                     <Select.Option value='true'>离场</Select.Option>
                  </Select>
               </Form.Item>
            </Col>
         </Row>
         <Divider />
         <Row gutter={16}>
            <Col span={12}>
               <Form.Item
                  label='平时心率'
                  name={["heart_rate"]}
                  rules={[{ required: false, message: "请输入平时心率" }]}
               >
                  <Input type='number' addonAfter='次/分' />
               </Form.Item>
            </Col>
            <Col span={12}>
               <Form.Item
                  label='平时呼吸频率'
                  name={["breath_rate"]}
                  rules={[{ required: false, message: "请输入平时呼吸频率" }]}
               >
                  <Input type='number' addonAfter='次/分' />
               </Form.Item>
            </Col>
         </Row>
         <Row gutter={16}>
            {createFormItem("上限比", ["heartBeatRatioUpper"], "%", true)}
            {createFormItem("上限值", ["heartRateUpperValue"], "次/分")}
            {createFormItem("上限比", ["breathRatioUpper"], "%", true)}
            {createFormItem("上限值", ["breathRateUpperValue"], "次/分")}
         </Row>
         <Row gutter={16}>
            {createFormItem("下限比", ["heartBeatRatioLower"], "%", true)}
            {createFormItem("下限值", ["heartRateLowerValue"], "次/分")}
            {createFormItem("下限比", ["breathRatioLower"], "%", true)}
            {createFormItem("下限值", ["breathRateLowerValue"], "次/分")}
         </Row>
         <Row gutter={16}>
            {createFormItem("静息心率下限比", ["restHeartBeatRatioLower"], "%", true)}
            {createFormItem("静息心率值", ["heartRateRestingValue"], "次/分")}
            {createFormItem("静息呼吸频率下限比", ["restBreathRatioLower"], "%", true)}
            {createFormItem("静息呼吸频率值", ["breathRateRestingValue"], "次/分")}
         </Row>
         <Row gutter={16}>
            <Col span={12}>
               <Form.Item name={["medical_history"]} label='病史' rules={[{ required: true, message: "请选择病史" }]}>
                  <Select placeholder='请选择病史' allowClear>
                     {MEDICAL_HISTORIES.map(
                        (
                           item // Use the imported constant
                        ) => (
                           <Select.Option key={item.value} value={item.value}>
                              {item.label}
                           </Select.Option>
                        )
                     )}
                  </Select>
               </Form.Item>
            </Col>
            <Col span={12}>
               <Form.Item name={["remark"]} label='其它病史/备注' rules={[{ required: false, message: "请输入备注" }]}>
                  <Input.TextArea rows={2} />
               </Form.Item>
            </Col>
         </Row>
      </>
   );
};

export default BasicInfoForm;
