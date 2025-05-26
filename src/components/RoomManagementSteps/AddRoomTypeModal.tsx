import React from "react";
import { Modal, Form, Input, Select, message } from "antd";
import { RoomType, TemplateType } from "../../types";
import axios from "axios";
import config from "../../config";

interface AddRoomTypeModalProps {
   isVisible: boolean;
   onCancel: () => void;
   onSuccess: (newType: RoomType) => void;
   roomTypes: RoomType[];
   roomTemplates: {
      maxPersonnel: number;
      maxRadars: number;
      templateId: number;
      templateName: string;
   }[];
}

const AddRoomTypeModal: React.FC<AddRoomTypeModalProps> = ({
   isVisible,
   onCancel,
   onSuccess,
   roomTypes,
   roomTemplates,
}) => {
   const [form] = Form.useForm();

   // 处理新增房间类型
   const handleAddType = async () => {
      try {
         await form.validateFields(); // 验证新增房间类型的表单字段
         const values = form.getFieldsValue();

         // 校验房间类型名称是否已存在
         const isTypeNameExist = roomTypes.some((type) => type.typeName === values.typeName);
         if (isTypeNameExist) {
            message.error("房间类型名称已存在，请使用其他名称");
            return;
         }

         // 调用新增房间类型接口
         const response = await axios.post(`${config.backend.url}/rooms/room-types`, {
            typeName: values.typeName,
            templateId: values.templateId, // 使用选择的模板ID
            description: values.description, // 可选描述
         });

         // 处理成功响应
         const newType = response.data;

         // 关闭模态框并重置表单
         form.resetFields();
         message.success("新增房间类型成功");

         // 通知父组件更新状态
         onSuccess(newType);
      } catch (error) {
         console.error("Error adding room type:", error);
         if (axios.isAxiosError(error)) {
            message.error(error.response?.data?.error || "新增房间类型失败");
         } else {
            message.error("新增房间类型失败");
         }
      }
   };

   // 取消时重置表单
   const handleCancel = () => {
      form.resetFields();
      onCancel();
   };

   return (
      <Modal title='新增房间类型' open={isVisible} onCancel={handleCancel} onOk={handleAddType}>
         <Form form={form} layout='vertical'>
            <Form.Item label='房间类型名称' name='typeName' rules={[{ required: true, message: "请输入房间类型名称" }]}>
               <Input placeholder='请输入房间类型名称' />
            </Form.Item>
            <Form.Item label='选择模板' name='templateId' rules={[{ required: true, message: "请选择模板" }]}>
               <Select placeholder='请选择模板'>
                  {roomTemplates.map((template) => (
                     <Select.Option key={template.templateId} value={template.templateId}>
                        {template.templateName} （雷达: {template.maxRadars}, 人数: {template.maxPersonnel}）
                     </Select.Option>
                  ))}
               </Select>
            </Form.Item>
            <Form.Item label='描述' name='description'>
               <Input.TextArea placeholder='请输入描述（选填）' />
            </Form.Item>
         </Form>
      </Modal>
   );
};

export default AddRoomTypeModal;
