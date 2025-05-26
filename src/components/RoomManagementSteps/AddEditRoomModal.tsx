import React, { useState, useEffect, useCallback } from "react";
import { Modal, Form, Input, Select, Button, Steps, InputNumber, Card, Row, Col, message } from "antd";
import { Room, RoomType, TemplateType, RadarConfig } from "../../types";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
import config from "../../config";
import { useDispatch, useSelector } from "react-redux";
import { setRooms } from "../../store/dataSlice";
import { RootState } from "../../store";
import AddRoomTypeModal from "./AddRoomTypeModal";

const { Step } = Steps;

interface AddEditRoomModalProps {
   isVisible: boolean;
   onCancel: () => void;
   editingRoom: Room | null;
   isEditing: boolean;
   roomTypes: RoomType[];
   roomTemplates: {
      maxPersonnel: number;
      maxRadars: number;
      templateId: number;
      templateName: string;
   }[];
}

const AddEditRoomModal: React.FC<AddEditRoomModalProps> = ({
   isVisible,
   onCancel,
   editingRoom,
   isEditing,
   roomTypes,
   roomTemplates,
}) => {
   const [form] = Form.useForm();
   const [currentStep, setCurrentStep] = useState(0);
   const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
   const [formKey, setFormKey] = useState(0);
   const [isAddTypeModalVisible, setIsAddTypeModalVisible] = useState(false);

   const dispatch = useDispatch();
   const rooms = useSelector((state: RootState) => state.data.rooms);

   // 在组件内部添加 fetchInitData 方法
   const fetchInitData = useCallback(async (roomId?: number) => {
      try {
         const response = await axios.get(`${config.backend.url}/rooms/init-data/${roomId || ""}`);
         const { room, roomTypes, templates } = response.data.data;

         // 更新房间类型和模板状态
      } catch (error) {
         console.error("Error fetching init data:", error);
         message.error("获取初始化数据失败！");
      }
   }, []);

   // 在 useEffect 中调用 fetchInitData
   useEffect(() => {
      if (isVisible) {
         fetchInitData(editingRoom?.id);
      }
   }, [isVisible, fetchInitData, editingRoom]);

   // 初始化表单数据
   useEffect(() => {
      if (editingRoom) {
         form.setFieldsValue({
            id: editingRoom.id,
            name: editingRoom.name,
            type: editingRoom.typeId,
            remark: editingRoom.remark || "",
            radars: editingRoom.radars.map((r) => ({
               id: r.id,
               person_pose: r.person_pose,
               distance: r.distance,
            })),
         });
      } else {
         form.resetFields();
         // 设置默认值
         form.setFieldsValue({
            radars: [{}],
         });
      }
   }, [editingRoom, form]);

   // 获取当前房间类型的雷达配置
   const getCurrentRoomConfig = () => {
      if (!selectedTemplate) return { maxRadars: 0 };
      const template = roomTemplates.find((t) => t.templateId === selectedTemplate);
      if (!template) return { maxRadars: 0 };
      return {
         showRadar: true, // 假设所有模板都显示雷达
         maxRadars: template.maxRadars,
         maxPersonnel: template.maxPersonnel,
      };
   };

   const handlePrev = () => {
      setCurrentStep((prev) => prev - 1);
   };

   const handleNext = () => {
      // 只验证当前步骤的字段
      const fieldsToValidate: string[] = [];

      if (currentStep === 0) {
         fieldsToValidate.push("type");
      } else if (currentStep === 1) {
         fieldsToValidate.push("name");
      } else if (currentStep === 2) {
         fieldsToValidate.push("radars");
      }

      form
         .validateFields(fieldsToValidate)
         .then(() => {
            // 保存当前步骤的数据
            const currentValues = form.getFieldsValue(fieldsToValidate);
            console.log(`Step ${currentStep} values:`, currentValues);

            setCurrentStep((prev) => prev + 1);
         })
         .catch((error) => {
            console.error("Validation failed:", error);
            message.error("请确保所有必填项已填写！");
         });
   };

   const handleAddRoom = async (values: any) => {
      try {
         const roomData = {
            name: values.name,
            typeId: values.type,
            radars: values.radars.map((r: any) => ({
               id: r.id,
               person_pose: r.person_pose,
               distance: r.distance,
            })),
            remark: values.remark || "",
         };

         const response = await axios.post(`${config.backend.url}/rooms`, roomData);
         const newRoom = response.data;
         dispatch(setRooms([...rooms, newRoom]));
         onCancel();
         message.success("新增房间成功");
      } catch (error) {
         console.error("Error adding room:", error);
         if (axios.isAxiosError(error)) {
            message.error(error.response?.data?.error || "新增房间失败！");
         } else {
            message.error("新增房间失败！");
         }
      }
   };

   const handleEditRoom = async (values: any) => {
      try {
         const roomData = {
            name: values.name,
            typeId: values.type,
            radars: values.radars.map((r: any) => ({
               id: r.id,
               person_pose: r.person_pose,
               distance: r.distance,
            })),
            remark: values.remark || "",
         };

         const response = await axios.put(`${config.backend.url}/rooms/${values.id}`, roomData);
         const newRoom = response.data;
         dispatch(setRooms(rooms.map((r) => (r.id === values.id ? newRoom : r))));
         onCancel();
         message.success("更新房间信息成功");
      } catch (error) {
         console.error("Error editing room:", error);
         if (axios.isAxiosError(error)) {
            message.error(error.response?.data?.error || "更新房间信息失败！");
         } else {
            message.error("更新房间信息失败！");
         }
      }
   };

   const handleFinish = () => {
      // 获取当前表单所有字段的值
      const allValues = form.getFieldsValue(true);
      console.log("==> ~ allValues:", allValues);

      // 验证所有必填字段
      form
         .validateFields()
         .then(() => {
            // 确保包含所有步骤的数据
            const formData = {
               name: allValues.name,
               type: allValues.type,
               radars: allValues.radars || [],
               remark: allValues.remark || "",
            };

            console.log("==> ~ formData:", formData);

            if (isEditing) {
               handleEditRoom({ ...formData, id: editingRoom?.id });
            } else {
               handleAddRoom(formData);
            }
         })
         .catch((error) => {
            console.error("Validation failed:", error);
            message.error("请确保所有必填项已填写！");
         });
   };

   const handleCancel = () => {
      setCurrentStep(0);
      form.resetFields();
      onCancel();
   };

   // 处理新增房间类型成功
   const handleAddTypeSuccess = (newType: RoomType) => {
      setIsAddTypeModalVisible(false);
      form.setFieldsValue({ type: newType.typeId });
   };

   // 修改第一步的步骤内容
   const getStepsItems = () => {
      const stepsItems = [
         {
            title: "选择房间类型",
            key: "selectRoomType",
            content: (
               <div>
                  <Form.Item name='type' label='房间类型' rules={[{ required: true, message: "请选择房间类型" }]}>
                     <div style={{ display: "flex", gap: 8 }}>
                        <Select
                           placeholder='请选择房间类型'
                           options={roomTypes.map((type) => ({
                              value: type.typeId,
                              label: type.typeName,
                           }))}
                           onChange={(value) => {
                              const selectedRoomType = roomTypes.find((t) => t.typeId === value);
                              setSelectedTemplate(selectedRoomType?.templateId || null);
                           }}
                        />
                        <Button onClick={() => setIsAddTypeModalVisible(true)}>新增</Button>
                     </div>
                  </Form.Item>
               </div>
            ),
         },
         {
            title: "房间基本信息",
            key: "roomInfo",
            content: (
               <>
                  <Form.Item label='名称' name='name' rules={[{ required: true, message: "请输入名称" }]}>
                     <Input placeholder='请输入房间号' />
                  </Form.Item>
                  <Form.Item label='备注' name='remark'>
                     <Input.TextArea rows={4} />
                  </Form.Item>
               </>
            ),
         },
         {
            title: "配置雷达",
            key: "configureRadar",
            content: (
               <div>
                  <Form.List name='radars' initialValue={[{}]}>
                     {(fields, { add, remove }) => (
                        <Card style={{ marginBottom: 16 }}>
                           {fields.map(({ key, name, ...restField }) => (
                              <Row key={key} gutter={16} style={{ marginBottom: 16, alignItems: "center" }}>
                                 <Col span={7}>
                                    <Form.Item
                                       {...restField}
                                       name={[name, "id"]}
                                       label='雷达编号'
                                       rules={[{ required: true, message: "请输入雷达编号" }]}
                                    >
                                       <Input placeholder='请输入雷达编号' />
                                    </Form.Item>
                                 </Col>
                                 <Col span={7}>
                                    <Form.Item
                                       {...restField}
                                       name={[name, "person_pose"]}
                                       label='人员姿态'
                                       rules={[{ required: true, message: "请选择人员姿态" }]}
                                    >
                                       <Select placeholder='请选择人员姿态'>
                                          <Select.Option value='坐姿'>坐姿</Select.Option>
                                          <Select.Option value='卧姿'>卧姿</Select.Option>
                                       </Select>
                                    </Form.Item>
                                 </Col>
                                 <Col span={7}>
                                    <Form.Item
                                       {...restField}
                                       name={[name, "distance"]}
                                       label='雷达距离'
                                       rules={[{ required: true, message: "请输入雷达距离" }]}
                                    >
                                       <InputNumber addonAfter='米' style={{ width: "100%" }} />
                                    </Form.Item>
                                 </Col>
                                 <Col span={3} style={{ textAlign: "right" }}>
                                    <Button danger type='link' icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                 </Col>
                              </Row>
                           ))}
                           <Form.Item>
                              <Button
                                 type='dashed'
                                 onClick={() => add()}
                                 block
                                 icon={<PlusOutlined />}
                                 disabled={fields.length >= getCurrentRoomConfig().maxRadars}
                              >
                                 添加雷达
                              </Button>
                           </Form.Item>
                        </Card>
                     )}
                  </Form.List>
               </div>
            ),
         },
      ];

      return stepsItems;
   };

   // 获取当前步骤内容
   const getCurrentStepContent = () => {
      return getStepsItems()[currentStep]?.content || null;
   };

   return (
      <>
         <Modal
            title={isEditing ? "编辑房间" : "新增房间"}
            open={isVisible}
            onCancel={handleCancel}
            footer={null}
            width={700}
         >
            <Form
               key={formKey}
               form={form}
               layout='vertical'
               onValuesChange={(changedValues) => {
                  if ("type" in changedValues) {
                     setFormKey((prev) => prev + 1); // 更新key强制重新渲染
                  }
               }}
            >
               <Steps current={currentStep} style={{ marginBottom: 20 }} items={getStepsItems()} />

               <Form.Item name='id' style={{ display: "none" }}>
                  <Input />
               </Form.Item>

               {/* 所有步骤的表单项都存在，但根据当前步骤显示或隐藏 */}
               <div style={{ display: currentStep === 0 ? "block" : "none" }}>
                  <Form.Item name='type' label='房间类型' rules={[{ required: true, message: "请选择房间类型" }]}>
                     <Select
                        placeholder='请选择房间类型'
                        options={roomTypes.map((type) => ({
                           value: type.typeId,
                           label: type.typeName,
                        }))}
                        onChange={(value) => {
                           const selectedRoomType = roomTypes.find((t) => t.typeId === value);
                           setSelectedTemplate(selectedRoomType?.templateId || null);
                        }}
                     />
                  </Form.Item>
               </div>

               <div style={{ display: currentStep === 1 ? "block" : "none" }}>
                  <Form.Item label='名称' name='name' rules={[{ required: true, message: "请输入名称" }]}>
                     <Input placeholder='请输入房间号' />
                  </Form.Item>
                  <Form.Item label='备注' name='remark'>
                     <Input.TextArea rows={4} />
                  </Form.Item>
               </div>

               <div style={{ display: currentStep === 2 ? "block" : "none" }}>
                  <Form.List name='radars' initialValue={[{}]}>
                     {(fields, { add, remove }) => (
                        <Card style={{ marginBottom: 16 }}>
                           {fields.map(({ key, name, ...restField }) => (
                              <Row key={key} gutter={16} style={{ marginBottom: 16, alignItems: "center" }}>
                                 <Col span={7}>
                                    <Form.Item
                                       {...restField}
                                       name={[name, "id"]}
                                       label='雷达编号'
                                       rules={[{ required: true, message: "请输入雷达编号" }]}
                                    >
                                       <Input placeholder='请输入雷达编号' />
                                    </Form.Item>
                                 </Col>
                                 <Col span={7}>
                                    <Form.Item
                                       {...restField}
                                       name={[name, "person_pose"]}
                                       label='人员姿态'
                                       rules={[{ required: true, message: "请选择人员姿态" }]}
                                    >
                                       <Select placeholder='请选择人员姿态'>
                                          <Select.Option value='坐姿'>坐姿</Select.Option>
                                          <Select.Option value='卧姿'>卧姿</Select.Option>
                                       </Select>
                                    </Form.Item>
                                 </Col>
                                 <Col span={7}>
                                    <Form.Item
                                       {...restField}
                                       name={[name, "distance"]}
                                       label='雷达距离'
                                       rules={[{ required: true, message: "请输入雷达距离" }]}
                                    >
                                       <InputNumber addonAfter='米' style={{ width: "100%" }} />
                                    </Form.Item>
                                 </Col>
                                 <Col span={3} style={{ textAlign: "right" }}>
                                    <Button danger type='link' icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                 </Col>
                              </Row>
                           ))}
                           <Form.Item>
                              <Button
                                 type='dashed'
                                 onClick={() => add()}
                                 block
                                 icon={<PlusOutlined />}
                                 disabled={fields.length >= getCurrentRoomConfig().maxRadars}
                              >
                                 添加雷达
                              </Button>
                           </Form.Item>
                        </Card>
                     )}
                  </Form.List>
               </div>

               <div style={{ marginTop: 24, textAlign: "right" }}>
                  {currentStep > 0 && (
                     <Button style={{ marginRight: 8 }} onClick={handlePrev}>
                        上一步
                     </Button>
                  )}
                  {currentStep < getStepsItems().length - 1 && (
                     <Button type='primary' onClick={handleNext}>
                        下一步
                     </Button>
                  )}
                  {currentStep === getStepsItems().length - 1 && (
                     <Button type='primary' onClick={handleFinish}>
                        完成
                     </Button>
                  )}
               </div>
            </Form>
         </Modal>
         <AddRoomTypeModal
            isVisible={isAddTypeModalVisible}
            onCancel={() => setIsAddTypeModalVisible(false)}
            onSuccess={handleAddTypeSuccess}
            roomTypes={roomTypes}
            roomTemplates={roomTemplates}
         />
      </>
   );
};

export default AddEditRoomModal;
