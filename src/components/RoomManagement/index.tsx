// components/RoomManagement/index.tsx

import React, { useState, useCallback, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Switch, message, Select, InputNumber } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { settingSpace } from "../../styles/theme";
import { Personnel, Radar, Room } from "../../types";
import axios from "axios";
import config from "../../config";

const RoomManagement: React.FC = () => {
   const [form] = Form.useForm();
   const [rooms, setRooms] = useState<Room[]>([]);
   const [isModalVisible, setIsModalVisible] = useState(false);
   const [editingRoom, setEditingRoom] = useState<Room | null>(null);
   const [isCheckInModalVisible, setIsCheckInModalVisible] = useState(false);
   const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
   const [availablePersonnel, setAvailablePersonnel] = useState<Personnel[]>([]);
   const [allPersonnel, setAllPersonnel] = useState<Personnel[]>([]);
   const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
   const [personPose, setPersonPose] = useState(""); // 初始化人员姿态状态

   const handlePersonPoseChange = (value: any) => {
      setPersonPose(value); // 更新人员姿态状态
   };

   // Fetch rooms and radars on component mount
   useEffect(() => {
      const fetchRooms = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/rooms`);
            const roomsData = response.data.map((room: Room) => ({
               ...room,
               mattress_distance: room.mattress_distance !== undefined && room.mattress_distance / 100,
               enabled: (room.enabled as unknown) === 1,
            }));
            setRooms(roomsData || []);
         } catch (error) {
            console.error("Error fetching rooms:", error);
            message.error("获取房间列表失败！");
         }
      };

      fetchRooms();
   }, []);

   useEffect(() => {
      const fetchAvailablePersonnel = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/personnel`);
            setAllPersonnel(response.data);
            // Filter out personnel who are already checked in
            const available = response.data.filter((p: Personnel) => !p.room_id);
            // Sort by update_date in descending order (latest first)
            available.sort((a: any, b: any) => new Date(b.update_date).getTime() - new Date(a.update_date).getTime());
            setAvailablePersonnel(available);
         } catch (error) {
            console.error("Error fetching available personnel:", error);
            message.error("获取人员信息失败！");
         }
      };

      if (isCheckInModalVisible) {
         fetchAvailablePersonnel();
      }
   }, [isCheckInModalVisible]);

   useEffect(() => {
      const fetchAvailablePersonnel = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/personnel`);
            setAllPersonnel(response.data);
            // Filter out personnel who are already checked in
            const available = response.data.filter((p: Personnel) => !p.room_id);
            // Sort by update_date in descending order (latest first)
            available.sort((a: any, b: any) => new Date(b.update_date).getTime() - new Date(a.update_date).getTime());
            setAvailablePersonnel(available);
         } catch (error) {
            console.error("Error fetching available personnel:", error);
            message.error("获取人员信息失败！");
         }
      };

      fetchAvailablePersonnel();
   }, []);

   const handleCheckIn = useCallback((room: Room) => {
      setSelectedRoom(room);
      setIsCheckInModalVisible(true);
   }, []);

   const handleCheckOut = useCallback(async (roomId: number) => {
      // Confirmation dialog
      Modal.confirm({
         title: "确认退场",
         icon: <ExclamationCircleOutlined />,
         content: "您确定要将人员从该房间退场吗？",
         okText: "确定",
         cancelText: "取消",
         onOk: async () => {
            // Handle check-out logic after confirmation
            try {
               await axios.post(`${config.backend.url}/rooms/${roomId}/checkout`);
               // Refetch rooms after check-out
               const response = await axios.get(`${config.backend.url}/rooms`);
               setRooms(response.data || []);
               message.success("出场成功");
            } catch (error) {
               console.error("Error checking out:", error);
               message.error("出场失败");
            }
         },
      });
   }, []);
   const handleCheckInOk = useCallback(async () => {
      if (!selectedRoom || !selectedPersonnel) {
         message.error("请先选择房间和人员");
         return;
      }

      try {
         await axios.post(`${config.backend.url}/rooms/${selectedRoom.id}/checkin`, {
            personnel_id: selectedPersonnel.id,
         });
         // Refetch rooms after check-in
         const response = await axios.get(`${config.backend.url}/rooms`);
         setRooms(response.data || []);
         setIsCheckInModalVisible(false);
         message.success("入场成功");
      } catch (error) {
         console.error("Error checking in:", error);
         if (axios.isAxiosError(error)) {
            message.error(error.response?.data?.error || "入场操作失败！");
         } else {
            message.error("入场操作失败！");
         }
      }
   }, [selectedRoom, selectedPersonnel]);

   const handleCheckInCancel = useCallback(() => {
      setIsCheckInModalVisible(false);
   }, []);

   const handlePersonnelSelectChange = useCallback(
      (value: number) => {
         const selected = availablePersonnel.find((p) => p.id === value);
         setSelectedPersonnel(selected || null);
      },
      [availablePersonnel]
   );

   const handleAddRoom = useCallback(
      async (room: Room) => {
         try {
            const response = await axios.post(`${config.backend.url}/rooms`, {
               ...room,
               mattress_distance: room.mattress_distance ? room.mattress_distance * 100 : 150,
            });
            const newRoom = response.data;
            setRooms([...rooms, { ...newRoom, mattress_distance: newRoom.mattress_distance / 100 }]);
            setIsModalVisible(false);
            message.success("新增房间成功");
         } catch (error) {
            console.error("Error adding room:", error);
            if (axios.isAxiosError(error)) {
               message.error(error.response?.data?.error || "新增房间失败！");
            } else {
               message.error("新增房间失败！");
            }
         }
      },
      [rooms]
   );

   const handleEditRoom = useCallback(
      async (room: Room) => {
         try {
            const response = await axios.put(`${config.backend.url}/rooms/${room.id}`, {
               ...room,
               mattress_distance: room.mattress_distance ? room.mattress_distance * 100 : 150,
            });
            const newRoom = response.data;
            setRooms(
               rooms.map((r) =>
                  r.id === room.id ? { ...newRoom, mattress_distance: newRoom.mattress_distance / 100 } : r
               )
            );
            setIsModalVisible(false);
            message.success("更新房间信息成功");
         } catch (error) {
            console.error("Error editing room:", error);
            if (axios.isAxiosError(error)) {
               message.error(error.response?.data?.error || "更新房间信息失败！");
            } else {
               message.error("更新房间信息失败！");
            }
         }
      },
      [rooms]
   );

   const handleDeleteRoom = useCallback(
      async (id: number) => {
         try {
            await axios.delete(`${config.backend.url}/rooms/${id}`);
            setRooms(rooms.filter((r) => r.id !== id));
            message.success("删除房间成功");
         } catch (error) {
            console.error("Error deleting room:", error);
            message.error("删除房间失败！");
         }
      },
      [rooms]
   );

   const showModal = useCallback(async (room: Room | null) => {
      room ? form.setFieldsValue(room) : form.resetFields();
      setEditingRoom(room);
      setPersonPose(room?.person_pose || "");
      setIsModalVisible(true);
   }, []);

   const handleOk = useCallback(
      (values: Room) => {
         if (editingRoom) {
            handleEditRoom(values);
         } else {
            handleAddRoom({ ...values, id: rooms.length + 1 });
         }
         setIsModalVisible(false);
      },
      [editingRoom, handleAddRoom, handleEditRoom, rooms.length]
   );

   const handleCancel = useCallback(() => {
      setIsModalVisible(false);
   }, []);

   const columns = [
      { title: "编号", dataIndex: "id", key: "id" },
      { title: "名称", dataIndex: "name", key: "name" },
      {
         title: "雷达编号",
         dataIndex: "radar_id",
         key: "radar_id",
      },
      { title: "雷达URL", dataIndex: "ip", key: "ip" },
      { title: "人员姿态", dataIndex: "person_pose", key: "person_pose" },
      {
         title: "床垫距离",
         dataIndex: "mattress_distance",
         key: "mattress_distance",
         render: (mattressDistance: number | null, record: Room) =>
            mattressDistance !== null && record.person_pose === "卧姿" ? `${mattressDistance.toFixed(2)} 米` : "-", // Convert to meters and display
      },
      {
         title: "人员",
         dataIndex: "personnel_id",
         key: "personnel",
         render: (personnelId: number | null) => {
            if (personnelId === null) return ""; // Display blank if no personnel is checked in

            // Find the personnel with the matching ID
            const checkedInPersonnel = allPersonnel.find((person) => person.id === personnelId);

            return checkedInPersonnel ? checkedInPersonnel.name : "N/A"; // Display name or N/A if not found
         },
      },
      {
         title: "启用监测",
         dataIndex: "enabled",
         key: "enabled",
         render: (enabled: boolean) => (enabled ? "是" : "否"),
      },
      { title: "备注", dataIndex: "remark", key: "remark" },
      {
         title: "操作",
         key: "action",
         render: (_: any, record: Room) => (
            <>
               <Button onClick={() => showModal(record)}>编辑</Button>
               <Button onClick={() => handleDeleteRoom(record.id)}>删除</Button>
            </>
         ),
      },
   ];

   return (
      <div style={settingSpace}>
         <h2>房间管理</h2>
         <Button type='primary' onClick={() => showModal(null)}>
            新增房间
         </Button>
         <Table dataSource={rooms} columns={columns} rowKey='id' />
         <Modal
            title={editingRoom ? "编辑房间" : "新增房间"}
            open={isModalVisible}
            onCancel={handleCancel}
            footer={null}
         >
            <Form form={form} onFinish={handleOk}>
               <Form.Item
                  label='编号'
                  name='id'
                  rules={[{ required: false, message: "请输入编号" }]}
                  style={{ display: "none" }}
               >
                  <Input />
               </Form.Item>
               <Form.Item label='名称' name='name' rules={[{ required: true, message: "请输入名称" }]}>
                  <Input placeholder='请输入房间号' />
               </Form.Item>
               <Form.Item label='雷达编号' name='radar_id' rules={[{ required: true, message: "请输入雷达编号" }]}>
                  <Input placeholder='请输入房间内的雷达编号' />
               </Form.Item>
               <Form.Item label='雷达URL' name='ip' rules={[{ required: true, message: "请输入雷达的URL地址" }]}>
                  <Input placeholder='请输入雷达的URL地址' />
               </Form.Item>
               <Form.Item label='人员姿态' name='person_pose'>
                  <Select placeholder='请选择人员姿态' onChange={handlePersonPoseChange}>
                     <Select.Option value='坐姿'>坐姿</Select.Option>
                     <Select.Option value='卧姿'>卧姿</Select.Option>
                  </Select>
               </Form.Item>
               <Form.Item label='床垫距离' name='mattress_distance'>
                  <InputNumber addonAfter={"米"} disabled={personPose !== "卧姿"} />
               </Form.Item>
               <Form.Item label='立即启用监测' name='enabled'>
                  <Switch />
               </Form.Item>
               <Form.Item label='备注' name='remark'>
                  <Input.TextArea rows={4} />
               </Form.Item>
               <Form.Item>
                  <Button type='primary' htmlType='submit'>
                     确定
                  </Button>
               </Form.Item>
            </Form>
         </Modal>
         <Modal title='人员进场' open={isCheckInModalVisible} onOk={handleCheckInOk} onCancel={handleCheckInCancel}>
            <Form>
               <Form.Item label='选择人员' name='personnel_id' rules={[{ required: true, message: "请选择人员" }]}>
                  <Select onChange={handlePersonnelSelectChange} placeholder='请选择人员'>
                     {availablePersonnel.map((person) => (
                        <Select.Option key={person.id} value={person.id}>
                           {person.name}
                        </Select.Option>
                     ))}
                  </Select>
               </Form.Item>

               {selectedPersonnel && ( // Display personnel details if selected
                  <div>
                     <h3>人员信息</h3>
                     <p>姓名: {selectedPersonnel.name}</p>
                     <p>身份证号码: {selectedPersonnel.id_number}</p>
                     {/* ... other personnel details ... */}
                  </div>
               )}
            </Form>
         </Modal>
      </div>
   );
};

export default RoomManagement;
