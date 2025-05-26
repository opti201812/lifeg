import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Button, message } from "antd";
import axios from "axios";
import config from "../../config";
import { RoomType } from "../../types";

interface AddEditRoomTypeModalProps {
   isVisible: boolean;
   onCancel: () => void;
   editingRoomType: RoomType | null;
   isEditing: boolean;
   roomTemplates: any[];
   onSuccess: () => void;
}

const AddEditRoomTypeModal: React.FC<AddEditRoomTypeModalProps> = ({
   isVisible,
   onCancel,
   editingRoomType,
   isEditing,
   roomTemplates,
   onSuccess,
}) => {
   const [form] = Form.useForm();
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      if (isVisible) {
         if (isEditing && editingRoomType) {
            form.setFieldsValue({
               typeName: editingRoomType.typeName,
               templateId: editingRoomType.templateId,
               remark: editingRoomType.remark,
            });
         } else {
            form.resetFields();
         }
      }
   }, [isVisible, isEditing, editingRoomType, form]);

   const handleSubmit = async () => {
      try {
         const values = await form.validateFields();
         setLoading(true);

         const roomTypeData = {
            typeName: values.typeName,
            templateId: values.templateId,
            remark: values.remark || "",
         };

         if (isEditing) {
            await axios.put(`${config.backend.url}/rooms/types/${editingRoomType?.typeId}`, roomTypeData);
            message.success("更新房间类型成功！");
         } else {
            await axios.post(`${config.backend.url}/rooms/types`, roomTypeData);
            message.success("新增房间类型成功！");
         }

         onSuccess();
         onCancel();
      } catch (error) {
         console.error("Error saving room type:", error);
         message.error("保存房间类型失败！");
      } finally {
         setLoading(false);
      }
   };

   return (
      <Modal
         title={isEditing ? "编辑房间类型" : "新增房间类型"}
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
            <Form.Item name='typeName' label='类型名称' rules={[{ required: true, message: "请输入类型名称" }]}>
               <Input placeholder='请输入类型名称' />
            </Form.Item>

            <Form.Item name='templateId' label='模板类型' rules={[{ required: true, message: "请选择模板类型" }]}>
               <Select placeholder='请选择模板类型'>
                  {roomTemplates.map((template) => (
                     <Select.Option key={template.templateId} value={template.templateId}>
                        {template.templateName}
                     </Select.Option>
                  ))}
               </Select>
            </Form.Item>

            <Form.Item name='remark' label='备注'>
               <Input.TextArea rows={4} placeholder='请输入备注' />
            </Form.Item>
         </Form>
      </Modal>
   );
};

export default AddEditRoomTypeModal;
