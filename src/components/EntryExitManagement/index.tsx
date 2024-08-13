import React, { useState, useCallback, useEffect } from "react";
import { Table, Button, message, Select, Modal, Form, Input, Switch } from "antd";
import axios from "axios";
import config from "../../config";
import { Personnel, Radar, Room } from "../../types";
import { settingSpace } from "../../styles/theme";

const EntryExitManagement: React.FC = () => {
   const [rooms, setRooms] = useState<Room[]>([]);
   const [personnel, setPersonnel] = useState<Personnel[]>([]);
   const [availablePersonnel, setAvailablePersonnel] = useState<Personnel[]>([]);
   const [isModalVisible, setIsModalVisible] = useState(false);
   const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
   const [availableRadars, setAvailableRadars] = useState<Radar[]>([]); // State to store available radar options
   const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
   const [form] = Form.useForm();
   const [editingRoom, setEditingRoom] = useState<Room | null>(null); // Add editingRoom state

   useEffect(() => {
      const fetchData = async () => {
         try {
            const roomsResponse = await axios.get(`${config.backend.url}/rooms`);
            setRooms(roomsResponse.data || []);

            const personnelResponse = await axios.get(`${config.backend.url}/personnel`);
            setPersonnel(personnelResponse.data || []);
         } catch (error) {
            console.error("Error fetching data:", error);
            message.error("Failed to load data");
         }
         try {
            const response = await axios.get(`${config.backend.url}/rooms/available-radars`);
            setAvailableRadars(response.data || []);
         } catch (error) {
            console.error("Error fetching available radars:", error);
            message.error("Failed to load available radars");
         }
      };

      fetchData();
   }, []);

   // Calculate the number of occupied rooms
   const occupiedRoomsCount = rooms.filter((room) => room.personnel_id !== null).length;

   const handleCheckIn = useCallback((record: Room) => {
      // Fetch available personnel when check-in modal is opened
      axios
         .get(`${config.backend.url}/personnel`)
         .then((res) => {
            // Filter out personnel who are already checked in
            const available = res.data.filter((p: Personnel) => !p.room_id);
            // Sort by update_date in descending order (latest first)
            available.sort((a: any, b: any) => new Date(b.update_date).getTime() - new Date(a.update_date).getTime());
            setAvailablePersonnel(available);
         })
         .catch((err) => {
            console.error("Error fetching available personnel:", err);
            message.error("Failed to load available personnel");
         });

      setSelectedRoom(record);
      setEditingRoom(null); // Set editingRoom to null for check-in
      setIsModalVisible(true);
   }, []);

   const handleCheckOut = useCallback(async (roomId: number) => {
      try {
         await axios.post(`<span class="math-inline">\{config\.backend\.url\}/rooms/</span>{roomId}/checkout`);
         // Refetch rooms after check-out
         const response = await axios.get(`${config.backend.url}/rooms`);
         setRooms(response.data || []);
         message.success("Check-out successful");
      } catch (error) {
         console.error("Error checking out:", error);
         message.error("Failed to check out");
      }
   }, []);

   const handleSwitchRoom = useCallback(async (record: Room) => {
      try {
         const response = await axios.get(`${config.backend.url}/personnel`);
         // 过滤出未入住的人员，或者当前房间的入住人员
         const available = response.data.filter((p: Personnel) => !p.room_id || p.room_id === record.id);
         // 按更新时间倒序排列
         available.sort((a: any, b: any) => new Date(b.update_date).getTime() - new Date(a.update_date).getTime());
         setAvailablePersonnel(available);

         // 预选当前房间的入住人员（如果存在）
         const currentPersonnel = available.find((p: Personnel) => p.id === record.personnel_id);
         setSelectedPersonnel(currentPersonnel || null);
      } catch (error) {
         console.error("Error fetching available personnel:", error);
         message.error("Failed to load available personnel");
      }

      setSelectedRoom(record);
      setEditingRoom(null); // 设置为 null，表示不是编辑房间
      setIsModalVisible(true);
   }, []);

   const handleModalOk = useCallback(async () => {
      if (!selectedRoom) {
         message.error("Please select a room");
         return;
      }

      try {
         if (editingRoom) {
            // Editing existing room
            const values = await form.validateFields();
            await axios.put(
               `<span class="math-inline">\{config\.backend\.url\}/rooms/</span>{selectedRoom.id}`,
               values
            );
         } else {
            // Check in personnel
            if (!selectedPersonnel) {
               message.error("Please select a personnel");
               return;
            }
            await axios.post(
               `<span class="math-inline">\{config\.backend\.url\}/rooms/</span>{selectedRoom.id}/checkin`,
               {
                  personnel_id: selectedPersonnel.id,
               }
            );
         }

         // Refetch rooms after update/check-in
         const response = await axios.get(`${config.backend.url}/rooms`);
         setRooms(response.data || []);
         setIsModalVisible(false);
         message.success(editingRoom ? "Room updated successfully" : "Check-in successful");
      } catch (error) {
         console.error("Error updating/checking in room:", error);
         if (axios.isAxiosError(error)) {
            message.error(error.response?.data?.error || "Failed to update/check in room");
         } else {
            message.error("Failed to update/check in room");
         }
      }
   }, [selectedRoom, selectedPersonnel, editingRoom, form]);

   const handleModalCancel = useCallback(() => {
      setIsModalVisible(false);
      setSelectedPersonnel(null); // Clear selected personnel on cancel
   }, []);

   const handlePersonnelSelectChange = useCallback(
      (value: number) => {
         const selected = availablePersonnel.find((p) => p.id === value);
         setSelectedPersonnel(selected || null);
      },
      [availablePersonnel]
   );

   const columns = [
      {
         title: "姓名",
         dataIndex: "personnel_id",
         key: "name",
         render: (personnelId: number | null) => {
            if (personnelId === null) return "";

            const checkedInPersonnel = personnel.find((person) => person.id === personnelId);
            return checkedInPersonnel ? checkedInPersonnel.name : "N/A";
         },
      },
      { title: "编号", dataIndex: "id", key: "id" },
      {
         title: "监测状态",
         dataIndex: "enabled",
         key: "enabled",
         render: (enabled: boolean) => (enabled ? "是" : "否"),
      },
      { title: "房间号", dataIndex: "name", key: "roomName" },
      { title: "备注", dataIndex: "remark", key: "remark" },
      {
         title: "操作",
         key: "action",
         render: (_: any, record: Room) => (
            <>
               <Button onClick={() => handleCheckIn(record)} disabled={record.personnel_id !== null}>
                  进场
               </Button>
               <Button onClick={() => handleCheckOut(record.id)} disabled={record.personnel_id === null}>
                  退场
               </Button>
               <Button onClick={() => handleSwitchRoom(record)} disabled={record.personnel_id === null}>
                  换房
               </Button>
            </>
         ),
      },
   ];

   return (
      <div style={settingSpace}>
         <h2>进出场管理</h2>
         <div>当前进场总人数：{occupiedRoomsCount}</div>
         <Table dataSource={rooms} columns={columns} rowKey='id' />
         <Modal
            title={selectedRoom ? (editingRoom ? "编辑房间" : "人员进场") : ""}
            open={isModalVisible}
            onOk={handleModalOk}
            onCancel={handleModalCancel}
         >
            {selectedRoom && (
               <Form form={form}>
                  {editingRoom ? ( // Editing existing room
                     <>
                        <Form.Item
                           label='编号'
                           name='id'
                           rules={[{ message: "请输入编号" }]}
                           style={{ display: "none" }}
                        >
                           <Input />
                        </Form.Item>
                        <Form.Item label='名称' name='name' rules={[{ required: true, message: "请输入名称" }]}>
                           <Input />
                        </Form.Item>
                        <Form.Item label='IP地址' name='ip' rules={[{ required: true, message: "请输入IP地址" }]}>
                           <Input />
                        </Form.Item>
                        <Form.Item
                           label='雷达编号'
                           name='radar_id'
                           rules={[{ required: true, message: "请选择雷达编号" }]}
                        >
                           <Select allowClear placeholder='请选择未分配的雷达编号' notFoundContent='暂无可用雷达'>
                              {availableRadars.map((radar) => (
                                 <Select.Option key={radar.id} value={radar.id}>
                                    {radar.name}
                                 </Select.Option>
                              ))}
                           </Select>
                        </Form.Item>
                        <Form.Item label='启用监测' name='enabled' valuePropName='checked'>
                           <Switch />
                        </Form.Item>
                        <Form.Item label='备注' name='remark'>
                           <Input.TextArea rows={4} />
                        </Form.Item>
                     </>
                  ) : (
                     // Check-in modal content
                     <>
                        <Form.Item
                           label='选择人员'
                           name='personnel_id'
                           rules={[{ required: true, message: "请选择人员" }]}
                        >
                           <Select onChange={handlePersonnelSelectChange} placeholder='请选择人员'>
                              {availablePersonnel.map((person) => (
                                 <Select.Option key={person.id} value={person.id}>
                                    {person.name}
                                 </Select.Option>
                              ))}
                           </Select>
                        </Form.Item>

                        {selectedPersonnel && (
                           <div>
                              <h3>人员信息</h3>
                              <p>姓名: {selectedPersonnel.name}</p>
                              <p>身份证号码: {selectedPersonnel.id_number}</p>
                              {/* ... other personnel details ... */}
                           </div>
                        )}
                     </>
                  )}

                  <Form.Item style={{ textAlign: "center" }}>
                     <Button type='primary' htmlType='submit'>
                        {editingRoom ? "保存" : "进场"}
                     </Button>{" "}
                     <Button onClick={handleModalCancel}>返回</Button>
                  </Form.Item>
               </Form>
            )}
         </Modal>
      </div>
   );
};

export default EntryExitManagement;
