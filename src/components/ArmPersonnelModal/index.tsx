import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Row, Col, Button, message, Tabs } from "antd";
import axios from "axios";
import config from "../../config";
import { MEDICAL_HISTORIES } from "../../types";
import { getBatteryStatus } from "../../utils";

interface ArmPersonnelModalProps {
   visible: boolean;
   initialValues?: {
      roomId?: number;
      braceletId?: string;
      radarId?: string;
      associationId?: string;
   };
   onCancel: () => void;
   onSubmit: (values: any) => void;
   title?: string;
}

const { Option } = Select;

/**
 * 获取设防/撤防弹窗的初始表单值
 * @param associationId 当前关联id
 * @param associations 关联数据数组
 * @param personnelList 人员数据数组
 * @param rooms 房间数据数组
 * @param bracelets 手环数据数组
 * @returns 用于form.setFieldsValue的对象
 */
function getInitialFormValues({
   associationId,
   associations,
   personnelList,
   rooms,
   bracelets,
}: {
   associationId: string | number;
   associations: any[];
   personnelList: any[];
   rooms: any[];
   bracelets: any[];
}) {
   // 1. 找到当前关联
   const assoc = associations.find(
      (a: any) => String(a.id) === String(associationId) || String(a.associationId) === String(associationId)
   );
   if (!assoc) return {};

   // 2. 找到人员
   const person =
      personnelList.find(
         (p: any) => String(p.id) === String(assoc.personnelId) || String(p.id) === String(assoc.personnel_id)
      ) || {};

   // 3. 找到房间
   const room =
      rooms.find((r: any) => String(r.id) === String(assoc.roomId) || String(r.id) === String(assoc.room_id)) || {};

   // 4. 找到手环
   const bracelet =
      bracelets.find(
         (b: any) => String(b.id) === String(assoc.braceletId) || String(b.deviceId) === String(assoc.braceletId)
      ) || {};

   // 5. 组装表单初始值
   return {
      roomId: assoc.roomId || assoc.room_id || room.id,
      braceletId: assoc.braceletId || bracelet.id,
      radarId: assoc.radarId,
      name: person.name,
      idNumber: person.id_number,
      gender: person.gender,
      age: person.age,
      heartRate: assoc.heartRate ?? person.heart_rate,
      breathRate: assoc.breathRate ?? person.breath_rate,
      restingHeartRate: assoc.restingHeartRate ?? person.heart_rate_resting,
      restingBreathRate: assoc.restingBreathRate ?? person.breath_rate_resting,
      medicalHistory: person.medical_history,
      remarks: person.remark,
   };
}

const ArmPersonnelModal: React.FC<ArmPersonnelModalProps> = ({
   visible,
   initialValues = {},
   onCancel,
   onSubmit,
   title,
}) => {
   const [form] = Form.useForm();
   const [rooms, setRooms] = useState<any[]>([]);
   const [personnel, setPersonnel] = useState<any[]>([]);
   const [bracelets, setBracelets] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);
   const [selectedPersonnel, setSelectedPersonnel] = useState<any>(null);
   const [isRadarRequired, setIsRadarRequired] = useState(false);
   const [roomRadars, setRoomRadars] = useState<any[]>([]);
   const [associations, setAssociations] = useState<any[]>([]);
   const [mode, setMode] = useState<"existing" | "new">("existing");
   // 一次性加载所有数据
   const fetchAllData = async () => {
      setLoading(true);
      try {
         // 使用Promise.all并行加载所有数据
         const [roomsRes, personnelRes, braceletsRes, associationsRes] = await Promise.all([
            axios.get(`${config.backend.url}/rooms`),
            axios.get(`${config.backend.url}/personnel`),
            axios.get(`${config.backend.url}/rooms/bracelets`),
            axios.get(`${config.backend.url}/associations`),
         ]);

         // 处理房间数据
         const roomsData = roomsRes.data || [];
         setRooms(roomsData);

         // 过滤出未离开的人员
         const availablePersonnel = personnelRes.data.filter((p: any) => !p.is_out);
         setPersonnel(availablePersonnel || []);

         // 处理手环数据
         const braceletData = braceletsRes.data || {};
         const onlineBracelets = braceletData.onlineBracelets || [];
         const offlineBracelets = braceletData.offlineBracelets || [];

         // 处理关联数据
         const associationsData = Array.isArray(associationsRes.data)
            ? associationsRes.data
            : Array.isArray(associationsRes.data?.data)
            ? associationsRes.data.data
            : [];
         setAssociations(associationsData);

         // 提取已分配的手环ID集合
         const assignedBraceletIds = new Set(
            associationsData.filter((a: any) => a.braceletId != null).map((a: any) => a.braceletId.toString())
         );

         // 处理手环列表：在线手环优先显示
         const processedBracelets = [
            // 在线手环
            ...onlineBracelets
               .filter((bracelet: any) => !assignedBraceletIds.has(bracelet.deviceId?.toString()))
               .map((bracelet: any) => ({
                  id: bracelet.deviceId?.toString(),
                  online: true,
                  battery: getBatteryStatus(bracelet.data?.batteryVoltage),
               })),
            // 离线手环
            ...offlineBracelets
               .filter((bracelet: any) => !assignedBraceletIds.has(bracelet.deviceId?.toString()))
               .map((bracelet: any) => ({
                  id: bracelet.deviceId?.toString(),
                  online: false,
                  battery: getBatteryStatus(bracelet.data?.batteryVoltage),
               })),
         ];

         setBracelets(processedBracelets || []);

         // === 新增：根据associationId自动填充表单 ===
         if (initialValues.associationId) {
            const formVals = getInitialFormValues({
               associationId: initialValues.associationId,
               associations: associationsData,
               personnelList: personnelRes.data,
               rooms: roomsRes.data,
               bracelets: [...(braceletsRes.data.onlineBracelets || []), ...(braceletsRes.data.offlineBracelets || [])],
            });
            form.setFieldsValue(formVals);
         }

         // 如果initialValues中有roomId，设置房间相关信息
         if (initialValues.roomId) {
            handleRoomChange(initialValues.roomId);
         }
      } catch (error) {
         console.error("获取数据失败:", error);
         message.error("获取数据失败，请检查网络连接");
      } finally {
         setLoading(false);
      }
   };

   // 组件显示时加载数据
   useEffect(() => {
      if (visible) {
         fetchAllData();
      }
   }, [visible, initialValues.roomId]); // 确保roomId在依赖数组中

   // 修改handleRoomChange方法
   const handleRoomChange = (roomId: number) => {
      console.log("Handling room change for:", roomId);
      const selectedRoom = rooms.find((room) => room.id === roomId);

      if (!selectedRoom || !selectedRoom.radars || selectedRoom.radars.length === 0) {
         message.warning("请先在房间管理中配置雷达");
         // 重置表单中的房间选择
         form.setFieldsValue({
            roomId: initialValues.roomId || null, // 回退到初始值或null
            radarId: undefined,
            braceletId: undefined,
         });
         setRoomRadars([]);
         setIsRadarRequired(false);
         return;
      }

      // 清除表单中的雷达和手环选择
      form.setFieldsValue({
         roomId: selectedRoom.id,
         radarId: undefined,
         braceletId: undefined,
      });

      // 更新该房间的雷达列表
      const radars = selectedRoom.radars || [];
      setRoomRadars(radars);

      // 检查该房间是否需要雷达
      setIsRadarRequired(false);

      // // 如果雷达列表只有一项，自动选择该项
      // if (radars.length === 1) {
      //    form.setFieldsValue({
      //       radarId: radars[0],
      //    });
      // }
   };

   // 获取雷达统计数据并填充表单
   const fetchAndFillRadarStats = async (radarId: string | number) => {
      if (!radarId) return;
      try {
         const res = await axios.get(`${config.backend.url}/radar/stats/${radarId}`);
         if (res.data) {
            form.setFieldsValue({
               heartRate: res.data.heart_rate ? Math.ceil(res.data.heart_rate) : undefined,
               breathRate: res.data.breath_rate ? Math.ceil(res.data.breath_rate) : undefined,
               restingHeartRate: res.data.heart_rate_resting ? Math.ceil(res.data.heart_rate_resting) : undefined,
               restingBreathRate: res.data.breath_rate_resting ? Math.ceil(res.data.breath_rate_resting) : undefined,
            });
         }
      } catch (error) {
         console.error("获取雷达统计数据失败:", error);
         message.error("获取雷达统计数据失败");
      }
   };

   // 修改后的handleFinish方法
   const handleFinish = async (values: any) => {
      try {
         setLoading(true);

         // 组装人员基础信息
         const personnelPayload: any = {
            name: values.name,
            id_number: values.idNumber,
            age: values.age,
            gender: values.gender,
            heart_rate: values.heartRate,
            breath_rate: values.breathRate,
            heart_rate_resting: values.restingHeartRate,
            breath_rate_resting: values.restingBreathRate,
            medical_history: values.medicalHistory,
            remark: values.remarks,
         };

         // 组装关联数据（移除人员基础信息）
         const associationPayload: any = {
            roomId: values.roomId || null,
            braceletId: values.braceletId || null,
            radarId: values.radarId || null,
         };

         if (mode === "new") {
            // 新增人员设防
            try {
               // 1. 新增人员
               const personnelRes = await axios.post(`${config.backend.url}/personnel`, {
                  name: values.name,
                  id_number: values.idNumber,
                  age: values.age,
                  gender: values.gender,
                  ...personnelPayload, // 包含基础信息
               });
               if (!personnelRes.data.success) {
                  throw new Error(personnelRes.data.error || "新增人员失败");
               }
               const personnelId = personnelRes.data.id;

               // 2. 新增关联
               const response = await axios.post(`${config.backend.url}/associations`, {
                  ...associationPayload,
                  personnelId,
               });
               if (response.data.success) {
                  message.success("设防成功");
                  onSubmit(response.data);
                  onCancel();
               } else {
                  throw new Error(response.data.error || "设防失败");
               }
            } catch (error: any) {
               console.error("新增人员或设防失败:", error);
               message.error(error.response?.data?.error || error.message || "新增人员或设防失败，请重试");
            }
         } else {
            // 修改验证逻辑
            if (!values.name) {
               message.error("请选择人员");
               return;
            }

            // 确保 selectedPersonnel 已设置
            if (!selectedPersonnel) {
               const selected = personnel.find((p) => p.name === values.name);
               if (selected) {
                  setSelectedPersonnel(selected);
               } else {
                  message.error("请选择有效人员");
                  return;
               }
            }

            // 1. 更新人员基础信息
            await axios.put(`${config.backend.url}/personnel/${selectedPersonnel.id}`, personnelPayload);

            // 2. 处理关联逻辑
            const exist = associations.find(
               (a) =>
                  String(a.personnelId) === String(selectedPersonnel.id) && String(a.roomId) === String(values.roomId)
            );
            if (exist) {
               // 已有关联，更新关联
               const response = await axios.put(
                  `${config.backend.url}/associations/${exist.associationId || exist.id}`,
                  {
                     ...associationPayload,
                     personnelId: selectedPersonnel.id,
                  }
               );
               if (response.data.success) {
                  if (response.data.deleted) {
                     message.success("关联已全部解除，自动删除");
                  } else {
                     message.success("设防信息已更新");
                  }
                  onSubmit(response.data);
                  onCancel();
               } else {
                  throw new Error(response.data.error || "设防失败");
               }
            } else {
               // 无关联，新增关联
               const response = await axios.post(`${config.backend.url}/associations`, {
                  ...associationPayload,
                  personnelId: selectedPersonnel.id,
               });
               if (response.data.success) {
                  message.success("设防成功");
                  onSubmit(response.data);
                  onCancel();
               } else {
                  throw new Error(response.data.error || "设防失败");
               }
            }
         }
      } catch (error: any) {
         console.error("设防失败:", error);
         message.error(error.response?.data?.error || error.message || "设防失败，请重试");
      } finally {
         setLoading(false);
      }
   };

   // 添加 useEffect 监听 mode 变化
   useEffect(() => {
      if (mode === "existing" && initialValues.associationId && personnel.length > 0) {
         const assoc = associations.find((a) => String(a.id) === String(initialValues.associationId));
         if (assoc) {
            const person = personnel.find((p) => String(p.id) === String(assoc.personnelId));
            if (person) {
               setSelectedPersonnel(person);
            }
         }
      }
   }, [mode, initialValues.associationId, personnel, associations]);

   const renderNameField = () => {
      if (mode === "existing") {
         return (
            <Col span={12}>
               <Form.Item label='姓名' name='name' rules={[{ required: true, message: "请选择或输入人员" }]}>
                  <Select
                     showSearch
                     placeholder='搜索已有人员'
                     filterOption={(input, option) =>
                        String(option?.children).toLowerCase().includes(input.toLowerCase())
                     }
                     onSelect={(value) => {
                        const selected = personnel.find((p) => parseInt(p.id) === parseInt(value));
                        if (selected) {
                           setSelectedPersonnel(selected);
                           form.setFieldsValue({
                              name: selected.name,
                              idNumber: selected.id_number,
                              gender: selected.gender,
                              age: selected.age,
                              heartRate: selected.heart_rate || undefined,
                              breathRate: selected.breath_rate || undefined,
                              restingHeartRate: selected.heart_rate_resting || undefined,
                              restingBreathRate: selected.breath_rate_resting || undefined,
                              medicalHistory: Array.isArray(selected.medical_history)
                                 ? selected.medical_history
                                 : [selected.medical_history].filter(Boolean),
                              remarks: selected.remark || "",
                           });
                        }
                     }}
                     defaultValue={selectedPersonnel?.id}
                  >
                     {personnel.map((person) => (
                        <Option key={parseInt(person.id)} value={parseInt(person.id)}>
                           {person.name}（{person.age || "未知"}岁，{person.gender === "female" ? "女" : "男"}）
                        </Option>
                     ))}
                  </Select>
               </Form.Item>
            </Col>
         );
      }

      return (
         <Col span={12}>
            <Form.Item label='姓名' name='name' rules={[{ required: true, message: "请输入姓名" }]}>
               <Input placeholder='输入新人员姓名' />
            </Form.Item>
         </Col>
      );
   };

   // 替换原有的Tabs组件使用方式
   const tabItems = [
      {
         key: "existing",
         label: "选择已有人员",
         children: null, // 内容在外部Form中统一管理
      },
      {
         key: "new",
         label: "新增人员",
         children: null,
      },
   ];

   return (
      <Modal title={title || "人员设防"} open={visible} onCancel={onCancel} footer={null} destroyOnClose>
         <Tabs
            activeKey={mode}
            onChange={(key) => {
               setMode(key as "existing" | "new");
               form.resetFields(["name", "idNumber", "gender", "age"]);
               setSelectedPersonnel(null);
            }}
            items={tabItems}
            tabBarStyle={{ marginBottom: 24 }}
         />

         <Form form={form} layout='vertical' onFinish={handleFinish} initialValues={initialValues}>
            <Row gutter={16}>
               {/* 房间选择 - 添加disabled属性和onChange事件 */}
               <Col span={12}>
                  <Form.Item label='房间' name='roomId' rules={[{ required: false, message: "请选择房间" }]}>
                     <Select
                        placeholder='请选择房间'
                        loading={loading}
                        disabled={!!initialValues.roomId}
                        onChange={handleRoomChange}
                     >
                        {rooms.map((room) => (
                           <Option key={room.id} value={room.id} disabled={!room.radars || room.radars.length === 0}>
                              {room.name}
                              {(!room.radars || room.radars.length === 0) && " (未配置雷达)"}
                           </Option>
                        ))}
                     </Select>
                  </Form.Item>
               </Col>
               {/* 动态姓名/身份证号字段 */}
               {renderNameField()}
            </Row>

            <Row gutter={16}>
               {/* 手环选择 - 调整排序显示 */}
               <Col span={12}>
                  <Form.Item label='手环' name='braceletId'>
                     <Select placeholder='请选择手环（可选）' loading={loading} allowClear>
                        {bracelets.map((bracelet) => (
                           <Option key={bracelet.id} value={bracelet.id}>
                              {bracelet.id} {bracelet.battery?.status}
                              {bracelet.online ? " (在线)" : " (离线)"}
                           </Option>
                        ))}
                     </Select>
                  </Form.Item>
               </Col>

               {/* 雷达选择 - 显示房间对应的雷达 */}
               <Col span={12}>
                  <Form.Item label='雷达' name='radarId' rules={[{ required: false, message: "请选择雷达" }]}>
                     <Select
                        placeholder={`请选择雷达${isRadarRequired ? "" : "（可选）"}`}
                        loading={loading}
                        allowClear
                        onChange={fetchAndFillRadarStats}
                     >
                        {roomRadars.map((radar) => (
                           <Option key={radar} value={radar}>
                              {`雷达 ${radar}`}
                           </Option>
                        ))}
                     </Select>
                  </Form.Item>
               </Col>
            </Row>

            {/* 身份证号 */}
            <Form.Item
               label='身份证号'
               name='idNumber'
               rules={[{ required: !selectedPersonnel, message: "请输入身份证号" }]}
            >
               <Input placeholder='请输入身份证号' readOnly={!!selectedPersonnel} />
            </Form.Item>

            {/* 性别 + 年龄 */}
            <Row gutter={16}>
               <Col span={12}>
                  <Form.Item label='性别' name='gender' rules={[{ required: false, message: "请选择性别" }]}>
                     <Select disabled={!!selectedPersonnel}>
                        <Option value='male'>男性</Option>
                        <Option value='female'>女性</Option>
                     </Select>
                  </Form.Item>
               </Col>
               <Col span={12}>
                  <Form.Item
                     label='年龄'
                     name='age'
                     rules={[
                        { required: false, message: "请输入年龄" },
                        { pattern: /^[0-9]+$/, message: "请输入有效年龄" },
                     ]}
                  >
                     <Input type='number' placeholder='请输入年龄' min='0' max='120' readOnly={!!selectedPersonnel} />
                  </Form.Item>
               </Col>
            </Row>

            {/* 心率 + 呼吸率 */}
            <Row gutter={16}>
               <Col span={12}>
                  <Form.Item label='心率 (bpm)' name='heartRate'>
                     <Input type='number' placeholder='请输入当前心率' />
                  </Form.Item>
               </Col>
               <Col span={12}>
                  <Form.Item label='呼吸率 (rpm)' name='breathRate'>
                     <Input type='number' placeholder='请输入当前呼吸率' />
                  </Form.Item>
               </Col>
            </Row>

            {/* 静息心率 */}
            <Row gutter={16}>
               <Col span={12}>
                  <Form.Item label='静息心率 (bpm)' name='restingHeartRate'>
                     <Input type='number' placeholder='请输入静息心率' />
                  </Form.Item>
               </Col>
               <Col span={12}>
                  <Form.Item label='静息呼吸率 (rpm)' name='restingBreathRate'>
                     <Input type='number' placeholder='请输入静息呼吸率' />
                  </Form.Item>
               </Col>
            </Row>

            {/* 既往病史 + 备注 */}
            <Row gutter={16}>
               <Col span={12}>
                  <Form.Item label='既往病史' name='medicalHistory'>
                     <Select mode='multiple' showSearch={false} optionFilterProp='label' placeholder='请选择既往病史'>
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

            <Form.Item>
               <div style={{ textAlign: "right" }}>
                  <Button onClick={onCancel} style={{ marginRight: 8 }}>
                     取消
                  </Button>
                  <Button type='primary' htmlType='submit' loading={loading}>
                     确定
                  </Button>
               </div>
            </Form.Item>
         </Form>
      </Modal>
   );
};

export default ArmPersonnelModal;
