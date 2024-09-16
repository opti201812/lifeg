// components/EntryExitManagement/index.tsx

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

   useEffect(() => {
      const fetchData = async () => {
         try {
            const roomsResponse = await axios.get(`${config.backend.url}/rooms`);
            setRooms(roomsResponse.data || []);

            const personnelResponse = await axios.get(`${config.backend.url}/personnel`);
            setPersonnel(personnelResponse.data || []);
         } catch (error) {
            console.error("Error fetching data:", error);
            message.error("获取房间信息失败！");
         }
         try {
            const response = await axios.get(`${config.backend.url}/rooms/available-radars`);
            setAvailableRadars(response.data || []);
         } catch (error) {
            console.error("Error fetching available radars:", error);
            message.error("获取雷达信息失败！");
         }
      };

      fetchData();
   }, []);

   // Calculate the number of occupied rooms
   const occupiedRoomsCount = rooms.filter((room) => room.personnel_id !== null).length;

   const handleCheckIn = useCallback(
      (record: Room) => {
         // Fetch available personnel when check-in modal is opened
         axios
            .get(`${config.backend.url}/personnel`)
            .then((res) => {
               // 获取所有已入住的 personnel_id
               const occupiedPersonnelIds = rooms.flatMap((room) => room.personnel_id);

               // 过滤掉已入住的人员
               const available = res.data.filter((p: Personnel) => !occupiedPersonnelIds.includes(p.id));
               // Sort by update_date in descending order (latest first)
               available.sort(
                  (a: any, b: any) => new Date(b.update_date).getTime() - new Date(a.update_date).getTime()
               );
               setAvailablePersonnel(available);
            })
            .catch((err) => {
               console.error("Error fetching available personnel:", err);
               message.error("获取人员信息失败！");
            });

         setSelectedRoom(record);
         setIsModalVisible(true);
      },
      [rooms]
   );

   const handleCheckOut = useCallback(async (roomId: number) => {
      try {
         await axios.post(`${config.backend.url}/rooms/${roomId}/checkout`);
         // Refetch rooms after check-out
         const response = await axios.get(`${config.backend.url}/rooms`);
         setRooms(response.data || []);
         message.success("出场成功");
      } catch (error) {
         console.error("Error checking out:", error);
         message.error("出场失败！");
      }
   }, []);

   const handleSwitchRoom = useCallback(
      async (record: Room) => {
         try {
            const availableRooms = rooms.filter((r) => r.personnel_id === null);
            if (availableRooms.length === 0) {
               message.error("没有可用的空闲房间！");
               return;
            }

            setSelectedRoom(record);
            // 設置 selectedPersonnel 為當前房間的人員
            const currentPersonnel = personnel.find((p) => p.id === record.personnel_id);
            setSelectedPersonnel(currentPersonnel || null);
            setAvailablePersonnel(currentPersonnel ? [currentPersonnel] : []);
            setIsModalVisible(true); // 打開 Modal

            form.setFieldsValue({ newRoomId: null, personnel_id: currentPersonnel?.id });
         } catch (error) {
            console.error("Error handling switch room:", error);
            message.error("换房操作失败！");
         }
      },
      [rooms, personnel]
   );

   const handleModalOk = useCallback(async () => {
      if (!selectedRoom) {
         message.error("请先选择一个房间");
         return;
      }

      try {
         if (false) {
         } else {
            // 处理换房逻辑
            if (selectedPersonnel && selectedRoom.personnel_id) {
               // 先给当前人员办理退房
               await axios.post(`${config.backend.url}/rooms/${selectedRoom.id}/checkout`);

               // 再给新房间办理入住
               const values = await form.validateFields();
               await axios.post(`${config.backend.url}/rooms/${values.newRoomId}/checkin`, {
                  personnel_id: selectedPersonnel.id,
               });
            } else {
               // 处理入住逻辑（与之前相同）
               if (!selectedPersonnel) {
                  message.error("请选择人员");
                  return;
               }
               await axios.post(`${config.backend.url}/rooms/${selectedRoom.id}/checkin`, {
                  personnel_id: selectedPersonnel.id,
               });
            }
         }

         // 刷新房间列表
         const response = await axios.get(`${config.backend.url}/rooms`);
         setRooms(response.data || []);
         setIsModalVisible(false);
         message.success("操作成功"); // 调整提示信息
      } catch (error) {
         console.error("Error updating/checking in/switching room:", error);
         if (axios.isAxiosError(error)) {
            message.error(error.response?.data?.error || "操作失败");
         } else {
            message.error("操作失败");
         }
      }
   }, [selectedRoom, selectedPersonnel, form]);

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
      { title: "编号", dataIndex: "id", key: "id" },
      { title: "房间号", dataIndex: "name", key: "roomName" },
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
      {
         title: "监测状态",
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
            title={selectedRoom ? "人员进场/换房" : ""} // 调整 Modal 标题
            open={isModalVisible}
            onOk={handleModalOk}
            onCancel={handleModalCancel}
         >
            {selectedRoom && (
               <Form form={form}>
                  {
                     <>
                        <Form.Item
                           label='选择人员'
                           name='personnel_id'
                           rules={[{ required: true, message: "请选择人员" }]}
                        >
                           <Select
                              onChange={handlePersonnelSelectChange}
                              placeholder='请选择人员'
                              disabled={selectedRoom?.personnel_id !== null}
                           >
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
                           </div>
                        )}

                        {/* 换房时显示新房间选择 */}
                        {selectedRoom.personnel_id && (
                           <Form.Item
                              label='选择新房间'
                              name='newRoomId'
                              rules={[{ required: true, message: "请选择新房间" }]}
                           >
                              <Select placeholder='请选择新房间'>
                                 {rooms
                                    .filter((r) => r.personnel_id === null && r.id !== selectedRoom.id)
                                    .map((room) => (
                                       <Select.Option key={room.id} value={room.id}>
                                          {room.name}
                                       </Select.Option>
                                    ))}
                              </Select>
                           </Form.Item>
                        )}
                     </>
                  }
               </Form>
            )}
         </Modal>
      </div>
   );
};

export default EntryExitManagement;
