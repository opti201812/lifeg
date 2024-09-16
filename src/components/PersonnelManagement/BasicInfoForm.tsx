// components/PersonnelManagement/BasicInfoForm.tsx
import React from "react";
import { Col, Form, Input, Row, Select } from "antd";
import { MEDICAL_HISTORIES, Personnel, Room } from "../../types";

interface BasicInfoFormProps {
   form: any; // You might need to replace 'any' with the actual type of your form instance
   editingPersonnel: Personnel | null;
}

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
            {" "}
            {/* Start a new row for two-column layout */}
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
            {" "}
            {/* Another row for two columns */}
            <Col span={12}>
               <Form.Item label='性别' name={["gender"]}>
                  <Select placeholder='请选择性别' allowClear>
                     <Select.Option value='男'>男</Select.Option>
                     <Select.Option value='女'>女</Select.Option>
                  </Select>
               </Form.Item>
            </Col>
            <Col span={12}>
               <Form.Item label='年龄' name={["age"]} rules={[{ required: true, message: "请输入年龄" }]}>
                  <Input type='number' />
               </Form.Item>
            </Col>
         </Row>
         <Row gutter={16}>
            <Col span={12}>
               <Form.Item label='职业' name={["occupation"]} rules={[{ required: false, message: "请输入职业" }]}>
                  <Input />
               </Form.Item>
            </Col>
         </Row>
         <Row gutter={16}>
            <Col span={12}>
               <Form.Item label='平均心率' name={["heart_rate"]} rules={[{ required: true, message: "请输入心率" }]}>
                  <Input type='number' />
               </Form.Item>
            </Col>
            <Col span={12}>
               <Form.Item
                  label='平均呼吸次数'
                  name={["breath_rate"]}
                  rules={[{ required: true, message: "请输入呼吸" }]}
               >
                  <Input type='number' />
               </Form.Item>
            </Col>
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
               <Form.Item name={["remark"]} label='备注' rules={[{ required: false, message: "请输入备注" }]}>
                  <Input.TextArea rows={2} />
               </Form.Item>
            </Col>
         </Row>
      </>
   );
};

export default BasicInfoForm;
