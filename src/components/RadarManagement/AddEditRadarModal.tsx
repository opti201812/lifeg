import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, InputNumber, Button, message } from "antd";
import axios from "axios";
import config from "../../config";

interface Radar {
   id: number;
   person_pose: string;
   targetDistance?: number | null; // 目标距离（雷达与目标物之间的距离）
   enabled?: boolean;
   remark?: string;
   createdAt?: string;
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
            // 读取目标距离
            const targetDistance = editingRadar.targetDistance ?? undefined;

            form.setFieldsValue({
               id: editingRadar.id,
               person_pose: editingRadar.person_pose,
               targetDistance: targetDistance !== null && targetDistance !== undefined ? targetDistance : undefined,
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
            remark: values.remark || "",
            targetDistance: values.targetDistance ?? 0,
         };

         // 先保存雷达基本信息
         if (isEditing) {
            await axios.put(`${config.backend.url}/rooms/radars/${editingRadar?.id}`, radarData);
            message.success("更新雷达成功！");
         } else {
            await axios.post(`${config.backend.url}/rooms/radars`, radarData);
            message.success("新增雷达成功！");
         }

         // 如果有目标距离，单独调用目标距离API
         if (values.targetDistance !== undefined && values.targetDistance !== null && values.targetDistance !== editingRadar?.targetDistance) {
            try {
               await axios.post(`${config.backend.url}/radar/${values.id}/target-distance`, {
                  targetDistance: values.targetDistance,
               });
            } catch (distanceError) {
               console.warn("设置目标距离失败，但雷达已保存:", distanceError);
               message.warning("雷达配置已保存，但目标距离设置失败");
            }
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
               <Input placeholder='请输入雷达ID' disabled={isEditing} />
            </Form.Item>

            <Form.Item name='person_pose' label='人员姿态' rules={[{ required: true, message: "请选择人员姿态" }]}>
               <Select placeholder='请选择人员姿态'>
                  <Select.Option value='坐姿'>坐姿</Select.Option>
                  <Select.Option value='卧姿'>卧姿</Select.Option>
               </Select>
            </Form.Item>

            <Form.Item
               name='targetDistance'
               label='目标距离'
               rules={[{ required: false, message: "请输入目标距离" }]}
               extra='雷达与目标物之间的距离（米），用于姿态计算'
            >
               <InputNumber
                  min={0}
                  max={5}
                  step={0.01}
                  addonAfter='米'
                  style={{ width: "100%" }}
                  placeholder='请输入目标距离'
               />
            </Form.Item>

            <Form.Item name='remark' label='备注'>
               <Input.TextArea rows={4} placeholder='请输入备注' />
            </Form.Item>
         </Form>
      </Modal>
   );
};

export default AddEditRadarModal;
