import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Row, Col, Button, message, Tabs } from "antd";
import axios from "axios";
import config from "../../config";
import { MEDICAL_HISTORIES } from "../../types";
import { getBatteryStatus } from "../../utils";

// 新增入口类型定义
type EntryType =
   | "ROOM_OVERVIEW" // 人员总览
   | "UNASSIGNED_BRACELET" // 未分配手环
   | "ASSIGNED_BRACELET" // 已分配手环
   | "ARMED_BRACELET" // 已设防手环
   | "ROOM_DETAIL"; // 新增房间详情入口

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
   entryType: EntryType; // 新增入口类型参数
   actionType?: "assign" | "arm" | "change" | "disarm"; // 操作类型
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
   entryType,
   actionType,
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
   const [mode, setMode] = useState<"existing" | "new">(initialValues.associationId ? "existing" : "new");
   const [loadingConfig, setLoadingConfig] = useState(false);
   const [isTemplate2, setIsTemplate2] = useState(false);

   // 修改getDialogConfig为同步函数
   const getDialogConfig = (entryType: EntryType, initialValues: any, associations: any[]) => {
      const isRoomOccupied = associations.some((a) => a.roomId === initialValues.roomId && a.personnelId);
      const { roomId: associatedRoomId } =
         associations.find((a) => parseInt(a.id) === parseInt(initialValues.associationId)) || {};

      const configs: Record<EntryType, any> = {
         ROOM_OVERVIEW: {
            disabled: {
               room: true,
               bracelet: false,
               personnel: isRoomOccupied,
            },
            required: {
               room: false,
               bracelet: isTemplate2, // 候审室时手环必选
               idNumber: true,
               gender: true,
               age: true,
               heartRate: true,
               breathRate: true,
               medicalHistory: true,
            },
            visible: {
               radar: !isTemplate2,
            },
         },
         UNASSIGNED_BRACELET: {
            disabled: {
               room: actionType !== "arm", // 房间可选
               bracelet: true, // 手环固定
               personnel: false, // 人员可选
            },
            required: {
               room: false,
               bracelet: true,
               idNumber: true,
               gender: true,
               age: true,
               heartRate: true,
               breathRate: true,
               medicalHistory: true,
            },
            visible: {
               radar: false,
            },
         },
         ASSIGNED_BRACELET: {
            disabled: {
               room: false, // 房间可选
               bracelet: true, // 手环固定
               personnel: true, // 人员固定
            },
            required: {
               room: true,
               bracelet: false,
               idNumber: true,
               gender: true,
               age: true,
               heartRate: true,
               breathRate: true,
               medicalHistory: true,
            },
            visible: {
               radar: !isTemplate2, // 当templateId不是2时显示
            },
         },
         ARMED_BRACELET: {
            disabled: {
               room: false, // 房间可变更
               bracelet: true, // 手环固定
               personnel: true, // 人员固定
            },
            required: {
               room: false,
               bracelet: false,
               idNumber: true,
               gender: true,
               age: true,
               heartRate: true,
               breathRate: true,
               medicalHistory: true,
            },
            visible: {
               radar: !isTemplate2, // 当templateId不是2时显示
            },
         },
         ROOM_DETAIL: {
            disabled: {
               room: !!associatedRoomId, // 房间固定（当前房间）
               bracelet: true, // 手环固定（关联手环）
               personnel: true, // 人员固定（关联人员）
            },
            required: {
               room: false,
               bracelet: isTemplate2,
               idNumber: true,
               gender: true,
               age: true,
               heartRate: true,
               breathRate: true,
               medicalHistory: true,
            },
            visible: {
               radar: !isTemplate2, // 当templateId不是2时显示
            },
         },
      };

      return configs[entryType];
   };

   const [controlState, setControlState] = useState<any>(getDialogConfig(entryType, initialValues, associations));

   // 添加 useEffect 监听 rooms 和 initialValues.roomId
   useEffect(() => {
      if (rooms.length > 0) {
         if (initialValues.roomId) {
            handleRoomChange(initialValues.roomId);
         } else if (!actionType || actionType === "assign") {
            // 仅非分配模式默认选中第一个房间
            // handleRoomChange(rooms[0].id);
         }
      }
   }, [rooms, initialValues.roomId, actionType]); // 确保actionType也在依赖数组中

   // 新增 useEffect 监听 initialValues.associationId，确保Tabs选中状态正确
   useEffect(() => {
      if (initialValues.associationId && mode !== "existing") {
         setMode("existing");
      }
   }, [initialValues.associationId, mode]);

   // 新增useEffect专门获取templateId
   useEffect(() => {
      const fetchTemplateId = async () => {
         if (initialValues.roomId) {
            try {
               const res = await axios.get(`${config.backend.url}/rooms/${initialValues.roomId}`);
               setIsTemplate2(res.data?.data?.templateId === 2);
            } catch (error) {
               console.error("获取房间信息失败:", error);
               setIsTemplate2(false);
            }
         }
      };

      fetchTemplateId();
   }, [initialValues.roomId]);

   // 修改 fetchAllData 方法，移除直接调用 handleRoomChange 的逻辑
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
         const roomsData = roomsRes.data?.data || roomsRes.data || [];
         setRooms(roomsData);

         // 处理关联数据
         const associationsData = Array.isArray(associationsRes.data?.data)
            ? associationsRes.data.data
            : Array.isArray(associationsRes.data)
            ? associationsRes.data
            : [];
         setAssociations(associationsData);

         // 提取已关联的人员ID集合
         const assignedPersonnelIds = new Set(
            associationsData.filter((a: any) => a.personnelId != null).map((a: any) => a.personnelId.toString())
         );

         // 过滤出未离开且未被关联的人员（如果是编辑模式，保留当前关联的人员）
         const personnelData = personnelRes.data?.data || personnelRes.data || [];
         const availablePersonnel = personnelData.filter((p: any) => {
            if (p.is_out) return false; // 排除已离开的人员

            // 如果是编辑模式且是当前关联的人员，则保留
            if (initialValues.associationId) {
               const currentAssoc = associationsData.find(
                  (a: any) => String(a.id || a.associationId) === String(initialValues.associationId)
               );
               if (currentAssoc && String(currentAssoc.personnelId) === String(p.id)) {
                  return true;
               }
            }

            // 排除已被其他关联使用的人员
            return !assignedPersonnelIds.has(p.id.toString());
         });
         setPersonnel(availablePersonnel || []);

         // 处理手环数据
         const braceletData = braceletsRes.data || {};
         const onlineBracelets = braceletData.onlineBracelets || [];
         const offlineBracelets = braceletData.offlineBracelets || [];

         // 提取已分配的手环ID集合
         const assignedBraceletIds = new Set(
            associationsData.filter((a: any) => a.braceletId != null).map((a: any) => a.braceletId.toString())
         );

         // 处理手环列表：在线手环优先显示，排除已被关联的手环
         const processedBracelets = [
            // 在线手环
            ...onlineBracelets
               .filter((bracelet: any) => {
                  const braceletId = bracelet.deviceId?.toString();
                  if (!braceletId) return false;

                  // 如果是编辑模式且是当前关联的手环，则保留
                  if (initialValues.associationId) {
                     const currentAssoc = associationsData.find(
                        (a: any) => String(a.id || a.associationId) === String(initialValues.associationId)
                     );
                     if (currentAssoc && String(currentAssoc.braceletId) === braceletId) {
                        return true;
                     }
                  }

                  // 排除已被其他关联使用的手环
                  return !assignedBraceletIds.has(braceletId);
               })
               .map((bracelet: any) => ({
                  id: bracelet.deviceId?.toString(),
                  online: true,
                  battery: getBatteryStatus(bracelet.data?.batteryVoltage),
               })),
            // 离线手环
            ...offlineBracelets
               .filter((bracelet: any) => {
                  const braceletId = bracelet.deviceId?.toString();
                  if (!braceletId) return false;

                  // 如果是编辑模式且是当前关联的手环，则保留
                  if (initialValues.associationId) {
                     const currentAssoc = associationsData.find(
                        (a: any) => String(a.id || a.associationId) === String(initialValues.associationId)
                     );
                     if (currentAssoc && String(currentAssoc.braceletId) === braceletId) {
                        return true;
                     }
                  }

                  // 排除已被其他关联使用的手环
                  return !assignedBraceletIds.has(braceletId);
               })
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
               personnelList: personnelData,
               rooms: roomsData,
               bracelets: [...(braceletsRes.data.onlineBracelets || []), ...(braceletsRes.data.offlineBracelets || [])],
            });
            form.setFieldsValue(formVals);
         } else if (actionType === "assign") {
            // 分配模式下，清空房间选择
            form.setFieldsValue({ roomId: null });
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
      const selectedRoom = rooms.find((room) => room.id === roomId);

      if (!selectedRoom || !selectedRoom.radars || selectedRoom.radars.length === 0) {
         // 重置表单中的房间选择
         form.setFieldsValue({
            roomId: initialValues.roomId || null, // 回退到初始值或null
            radarId: undefined,
         });
         setRoomRadars([]);
         setIsRadarRequired(false);
         return;
      }

      // 获取当前关联的雷达ID
      const currentRadarId = associations.find((a) => String(a.id) === String(initialValues.associationId))?.radarId;

      // 更新该房间的雷达列表
      const radars = selectedRoom.radars || [];
      setRoomRadars(radars);

      // 设置表单值
      form.setFieldsValue({
         roomId: selectedRoom.id,
         radarId: currentRadarId || undefined, // 如果有当前关联雷达则使用，否则清空
      });

      // 检查该房间是否需要雷达
      setIsRadarRequired(false);
   };

   // 获取雷达统计数据并填充表单
   const fetchAndFillRadarStats = async (radarId: string | number) => {
      if (!radarId) return;
      try {
         const res = await axios.get(`${config.backend.url}/radar/stats/${radarId}`);
         if (res.data) {
            const currentValues = form.getFieldsValue([
               "heartRate",
               "breathRate",
               "restingHeartRate",
               "restingBreathRate",
            ]);

            const newValues: Record<string, any> = {};

            if (!currentValues.heartRate && res.data.heart_rate) {
               newValues.heartRate = Math.ceil(res.data.heart_rate);
            }
            if (!currentValues.breathRate && res.data.breath_rate) {
               newValues.breathRate = Math.ceil(res.data.breath_rate);
            }
            if (!currentValues.restingHeartRate && res.data.heart_rate_resting) {
               newValues.restingHeartRate = Math.ceil(res.data.heart_rate_resting);
            }
            if (!currentValues.restingBreathRate && res.data.breath_rate_resting) {
               newValues.restingBreathRate = Math.ceil(res.data.breath_rate_resting);
            }

            if (Object.keys(newValues).length > 0) {
               form.setFieldsValue(newValues);
            }
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
               const personnelId = personnelRes.data.data?.id || personnelRes.data.id;

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
            const exist = associations.find((a) => String(a.personnelId) === String(selectedPersonnel.id));
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

   // 在useEffect中加载配置
   useEffect(() => {
      const loadConfig = async () => {
         setLoadingConfig(true);
         const config = getDialogConfig(entryType, initialValues, associations);
         setControlState(config);
         setLoadingConfig(false);
      };
      loadConfig();
   }, [entryType, initialValues, associations, isTemplate2]);

   const renderNameField = () => {
      if (mode === "existing" || initialValues.associationId) {
         return (
            <Col span={12}>
               <Form.Item label='姓名' name='name' rules={[{ required: true, message: "请选择或输入人员" }]}>
                  <Select
                     showSearch
                     placeholder='搜索已有人员'
                     filterOption={(input, option) =>
                        String(option?.children).toLowerCase().includes(input.toLowerCase())
                     }
                     disabled={!!initialValues.associationId}
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
                              medicalHistory: selected.medical_history || undefined,
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
         key: "new",
         label: "新增人员",
         disabled: !!initialValues.associationId, // 禁用 "新增人员" Tab
      },
      {
         key: "existing",
         label: "选择已有人员",
      },
   ];

   // 根据操作类型覆盖配置
   if (entryType === "ROOM_DETAIL") {
      if (actionType === "disarm") {
         controlState.disabled.room = true; // 撤防时房间不可变
      } else if (actionType === "arm") {
         controlState.disabled.bracelet = false; // 设防时可更换手环
      }
   }

   return (
      <Modal title={title || "人员设防"} open={visible} onCancel={onCancel} footer={null} destroyOnHidden>
         <Tabs
            activeKey={mode}
            onChange={(key) => {
               if (!initialValues.associationId) {
                  // 仅允许切换 Tab 当无 associationId 时
                  setMode(key as "existing" | "new");
                  form.resetFields(["name", "idNumber", "gender", "age"]);
                  setSelectedPersonnel(null);
               }
            }}
            items={tabItems}
            tabBarStyle={{ marginBottom: 24 }}
         />

         <Form form={form} layout='vertical' onFinish={handleFinish} initialValues={initialValues}>
            <Row gutter={16}>
               {/* 房间选择 - 添加disabled属性和onChange事件 */}
               <Col span={12}>
                  <Form.Item
                     label='房间'
                     name='roomId'
                     rules={[
                        {
                           required: controlState.required.room,
                           message: "请选择房间",
                        },
                     ]}
                  >
                     <Select
                        placeholder='请选择房间'
                        loading={loading}
                        disabled={controlState.disabled.room}
                        onChange={handleRoomChange}
                        allowClear={!controlState.required.room} // 非必填时允许清除
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

            {/* 当是候审室时显示提示 */}
            {!controlState.visible.radar && (
               <Row gutter={16}>
                  <Col span={24}>
                     <div style={{ color: "#999", fontSize: "14px", marginBottom: "16px" }}>
                        * 候审室无雷达数据，人员须佩戴手环
                     </div>
                  </Col>
               </Row>
            )}

            <Row gutter={16}>
               {/* 手环选择 - 调整排序显示 */}
               <Col span={12}>
                  <Form.Item
                     label='手环'
                     name='braceletId'
                     rules={[
                        {
                           required: controlState.required.bracelet,
                           message: "请选择手环",
                        },
                     ]}
                  >
                     <Select
                        placeholder={controlState.visible.radar ? "请选择手环（可选）" : "请选择手环"}
                        loading={loading}
                        disabled={controlState.disabled.bracelet}
                        allowClear={!controlState.disabled.bracelet && !controlState.visible.radar} // 候审室时不允许清除
                     >
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
               {controlState.visible.radar && (
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
               )}
            </Row>

            {/* 身份证号 */}
            <Form.Item
               label='身份证号'
               name='idNumber'
               rules={[
                  {
                     required: controlState.required.idNumber,
                     message: "请输入身份证号",
                  },
               ]}
            >
               <Input placeholder='请输入身份证号' readOnly={!!selectedPersonnel} />
            </Form.Item>

            {/* 性别 + 年龄 */}
            <Row gutter={16}>
               <Col span={12}>
                  <Form.Item
                     label='性别'
                     name='gender'
                     rules={[
                        {
                           required: controlState.required.gender,
                           message: "请选择性别",
                        },
                     ]}
                  >
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
                        {
                           required: controlState.required.age,
                           message: "请输入年龄",
                        },
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
                  <Form.Item
                     label='心率 (bpm)'
                     name='heartRate'
                     rules={[
                        {
                           required: controlState.required.heartRate,
                           message: "请输入当前心率",
                        },
                     ]}
                  >
                     <Input type='number' placeholder='请输入当前心率' />
                  </Form.Item>
               </Col>
               <Col span={12}>
                  <Form.Item
                     label='呼吸率 (rpm)'
                     name='breathRate'
                     rules={[
                        {
                           required: controlState.required.breathRate,
                           message: "请输入当前呼吸率",
                        },
                     ]}
                  >
                     <Input type='number' placeholder='请输入当前呼吸率' />
                  </Form.Item>
               </Col>
            </Row>

            {/* 静息心率 */}
            <Row gutter={16}>
               <Col span={12}>
                  <Form.Item
                     label='静息心率 (bpm)'
                     name='restingHeartRate'
                     rules={[
                        {
                           required: controlState.required.heartRate,
                           message: "请输入静息心率",
                        },
                     ]}
                  >
                     <Input type='number' placeholder='请输入静息心率' />
                  </Form.Item>
               </Col>
               <Col span={12}>
                  <Form.Item
                     label='静息呼吸率 (rpm)'
                     name='restingBreathRate'
                     rules={[
                        {
                           required: controlState.required.breathRate,
                           message: "请输入静息呼吸率",
                        },
                     ]}
                  >
                     <Input type='number' placeholder='请输入静息呼吸率' />
                  </Form.Item>
               </Col>
            </Row>

            {/* 既往病史 + 备注 */}
            <Row gutter={16}>
               <Col span={12}>
                  <Form.Item
                     label='既往病史'
                     name='medicalHistory'
                     rules={[
                        {
                           required: controlState.required.medicalHistory,
                           message: "请选择既往病史",
                        },
                     ]}
                  >
                     <Select showSearch={false} optionFilterProp='label' placeholder='请选择既往病史'>
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
