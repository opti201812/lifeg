import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, InputNumber, Button, message } from "antd";
import axios from "axios";
import config from "../../config";

interface Radar {
   id: number;
   person_pose: string;
   distance: number;
   remark?: string;
}

interface AddEditRadarModalProps {
   isVisible: boolean;
   onCancel: () => void;
   editingRadar: Radar | null;
   isEditing: boolean;
   onSuccess: () => void;
}

const AddEditRadarModal: React.FC<AddEditRadarModalProps> = ({
   isVisible,
   onCancel,
   editingRadar,
   isEditing,
   onSuccess,
}) => {
   const [form] = Form.useForm();
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      if (isVisible) {
         if (isEditing && editingRadar) {
            form.setFieldsValue({
               id: editingRadar.id,
               person_pose: editingRadar.person_pose,
               distance: editingRadar.distance,
               remark: editingRadar.remark,
            });
         } else {
            form.resetFields();
         }
      }
   }, [isVisible, isEditing, editingRadar, form]);

   const handleSubmit = async () => {
      try {
         const values = await form.validateFields();
         setLoading(true);

         const radarData = {
            id: values.id,
            person_pose: values.person_pose,
            distance: values.distance,
            remark: values.remark || "",
         };

         if (isEditing) {
            await axios.put(`${config.backend.url}/rooms/radars/${editingRadar?.id}`, radarData);
            message.success("更新雷达成功！");
         } else {
            await axios.post(`${config.backend.url}/rooms/radars`, radarData);
            message.success("新增雷达成功！");
         }

         onSuccess();
         onCancel();
      } catch (error) {
         console.error("Error saving radar:", error);
         message.error("保存雷达失败！");
      } finally {
         setLoading(false);
      }
   };

   return (
      <Modal
         title={isEditing ? "编辑雷达" : "新增雷达"}
         open={isVisible}
         onCancel={onCancel}
         footer={[
            <Button key='cancel' onClick={onCancel}>
               取消
            </Button>,
            <Button key='submit' type='primary' loading={loading} onClick={handleSubmit}>
               保存
            </Button>,
         ]}
      >
         <Form form={form} layout='vertical'>
            <Form.Item name='id' label='雷达ID' rules={[{ required: true, message: "请输入雷达ID" }]}>
               <Input placeholder='请输入雷达ID' />
            </Form.Item>

            <Form.Item name='person_pose' label='人员姿态' rules={[{ required: true, message: "请选择人员姿态" }]}>
               <Select placeholder='请选择人员姿态'>
                  <Select.Option value='坐姿'>坐姿</Select.Option>
                  <Select.Option value='卧姿'>卧姿</Select.Option>
               </Select>
            </Form.Item>

            <Form.Item name='distance' label='距离' rules={[{ required: true, message: "请输入距离" }]}>
               <InputNumber min={0} addonAfter='米' style={{ width: "100%" }} placeholder='请输入距离' />
            </Form.Item>

            <Form.Item name='remark' label='备注'>
               <Input.TextArea rows={4} placeholder='请输入备注' />
            </Form.Item>
         </Form>
      </Modal>
   );
};

export default AddEditRadarModal;
