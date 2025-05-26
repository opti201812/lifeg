import React, { useEffect } from "react";
import { Modal, Form, Input, Select, Button, message } from "antd";
import axios from "axios";
import config from "../../config";
import { Room, RoomType } from "../../types";

const { Option } = Select;

interface AddEditRoomModalProps {
   isVisible: boolean;
   onCancel: () => void;
   editingRoom: Room | null;
   isEditing: boolean;
   roomTypes: RoomType[];
   roomTemplates: any[];
   availableRadars: any[];
   onSuccess: () => void;
}

const AddEditRoomModal: React.FC<AddEditRoomModalProps> = ({
   isVisible,
   onCancel,
   editingRoom,
   isEditing,
   roomTypes,
   roomTemplates,
   availableRadars,
   onSuccess,
}) => {
   const [form] = Form.useForm();
   const [selectedTypeId, setSelectedTypeId] = React.useState<number | undefined>(editingRoom?.typeId);
   const selectedRadars = Form.useWatch("radars", form);

   useEffect(() => {
      if (isVisible && isEditing && editingRoom) {
         form.setFieldsValue({
            name: editingRoom.name,
            typeId: editingRoom.typeId,
            remark: editingRoom.remark || "",
            radars: Array.isArray(editingRoom.radars)
               ? editingRoom.radars
               : ((editingRoom.radars as { id: string | number }[]) || []).map((radar) => radar.id),
         });
         setSelectedTypeId(editingRoom.typeId);
      } else if (isVisible && !isEditing) {
         form.resetFields();
         setSelectedTypeId(undefined);
      }
   }, [isVisible, isEditing, editingRoom, form]);

   const getAvailableRadarsForForm = () => {
      if (isEditing && editingRoom) {
         const currentRoomRadarIds = Array.isArray(editingRoom.radars)
            ? editingRoom.radars
            : ((editingRoom.radars as { id: string | number }[]) || []).map((radar) => radar.id);

         const currentRoomRadars = (currentRoomRadarIds as (string | number)[]).map((id) => {
            const radarInfo = availableRadars.find((r) => r.id === id);
            return (
               radarInfo || {
                  id,
                  name: `雷达 ${id}`,
               }
            );
         });

         return [...currentRoomRadars, ...availableRadars.filter((radar) => !currentRoomRadarIds.includes(radar.id))];
      }
      return availableRadars;
   };

   const handleSubmit = async () => {
      try {
         const values = await form.validateFields();
         const formData = {
            name: values.name,
            typeId: values.typeId,
            remark: values.remark,
            radars: values.radars || [],
         };

         if (isEditing && editingRoom) {
            await axios.put(`${config.backend.url}/rooms/${editingRoom.id}`, formData);
            message.success("房间更新成功！");
         } else {
            await axios.post(`${config.backend.url}/rooms`, formData);
            message.success("房间添加成功！");
         }

         onCancel();
         onSuccess();
      } catch (error) {
         console.error("Form submission error:", error);
         message.error("操作失败，请检查输入！");
      }
   };

   const getTemplateInfo = (typeId: number) => {
      const roomType = roomTypes.find((t) => t.typeId === typeId);
      if (!roomType) return { maxRadars: 0, maxPersonnel: 0 };

      const template = roomTemplates.find((t) => t.templateId === roomType.templateId);
      return {
         maxRadars: template?.maxRadars || 0,
         maxPersonnel: template?.maxPersonnel || 0,
      };
   };

   const renderTemplateInfo = () => {
      if (!selectedTypeId) return null;

      const { maxRadars, maxPersonnel } = getTemplateInfo(selectedTypeId);
      return (
         <div style={{ marginBottom: 16 }}>
            <div>雷达最大数量: {maxRadars}</div>
            <div>人员最大数量: {maxPersonnel}</div>
         </div>
      );
   };

   return (
      <Modal title={isEditing ? "编辑房间" : "新增房间"} open={isVisible} onCancel={onCancel} footer={null} width={600}>
         <Form form={form} layout='vertical' onFinish={handleSubmit}>
            <Form.Item name='name' label='房间名称' rules={[{ required: true, message: "请输入房间名称" }]}>
               <Input placeholder='请输入房间名称' />
            </Form.Item>

            <Form.Item name='typeId' label='房间类型' rules={[{ required: true, message: "请选择房间类型" }]}>
               <Select placeholder='请选择房间类型' onChange={(value) => setSelectedTypeId(value as number)}>
                  {roomTypes.map((type) => (
                     <Option key={type.typeId} value={type.typeId}>
                        {type.typeName}
                     </Option>
                  ))}
               </Select>
            </Form.Item>

            {renderTemplateInfo()}

            <Form.Item
               name='radars'
               label='雷达选择'
               tooltip='可选择一个或多个雷达，或留空'
               rules={[
                  {
                     validator: (_, value) => {
                        if (!selectedTypeId) return Promise.resolve();
                        const { maxRadars } = getTemplateInfo(selectedTypeId);
                        if (value?.length > maxRadars) {
                           return Promise.reject(`最多只能选择 ${maxRadars} 个雷达`);
                        }
                        return Promise.resolve();
                     },
                  },
               ]}
               extra={
                  selectedRadars?.length > 1 && (
                     <div style={{ color: "#faad14", marginTop: 8 }}>* 第一个雷达被视为主雷达，请注意选择顺序</div>
                  )
               }
            >
               <Select
                  mode='multiple'
                  placeholder='请选择雷达（可选）'
                  style={{ width: "100%" }}
                  optionFilterProp='children'
               >
                  {getAvailableRadarsForForm().map((radar) => (
                     <Option key={radar.id} value={radar.id}>
                        {radar.name || `雷达 ${radar.id}`}
                     </Option>
                  ))}
               </Select>
            </Form.Item>

            <Form.Item name='remark' label='备注'>
               <Input.TextArea rows={4} placeholder='请输入备注信息（可选）' />
            </Form.Item>

            <Form.Item>
               <div style={{ textAlign: "right" }}>
                  <Button onClick={onCancel} style={{ marginRight: 8 }}>
                     取消
                  </Button>
                  <Button type='primary' htmlType='submit'>
                     保存
                  </Button>
               </div>
            </Form.Item>
         </Form>
      </Modal>
   );
};

export default AddEditRoomModal;
