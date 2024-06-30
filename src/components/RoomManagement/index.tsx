import React, { useState, useCallback } from "react";
import { Table, Button, Modal, Form, Input, Switch } from "antd";

interface Room {
   id: number;
   name: string;
   ip: string;
   radarId: number;
   enabled: boolean;
   remark: string;
}

const RoomManagement: React.FC = () => {
   const [rooms, setRooms] = useState<Room[]>([]);
   const [isModalVisible, setIsModalVisible] = useState(false);
   const [editingRoom, setEditingRoom] = useState<Room | null>(null);

   const handleAddRoom = useCallback(
      (room: Room) => {
         setRooms([...rooms, room]);
      },
      [rooms]
   );

   const handleEditRoom = useCallback(
      (room: Room) => {
         setRooms(rooms.map((r) => (r.id === room.id ? room : r)));
      },
      [rooms]
   );

   const handleDeleteRoom = useCallback(
      (id: number) => {
         setRooms(rooms.filter((r) => r.id !== id));
      },
      [rooms]
   );

   const showModal = useCallback((room: Room | null) => {
      setEditingRoom(room);
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
      { title: "IP地址", dataIndex: "ip", key: "ip" },
      { title: "雷达编号", dataIndex: "radarId", key: "radarId" },
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
      <div>
         <h2>房间管理</h2>
         <Button type='primary' onClick={() => showModal(null)}>
            新增房间
         </Button>
         <Table dataSource={rooms} columns={columns} rowKey='id' />
         <Modal
            title={editingRoom ? "编辑房间" : "新增房间"}
            visible={isModalVisible}
            onCancel={handleCancel}
            footer={null}
         >
            <Form
               initialValues={editingRoom || { id: "", name: "", ip: "", radarId: "", enabled: false, remark: "" }}
               onFinish={handleOk}
            >
               <Form.Item label='编号' name='id' rules={[{ required: true, message: "请输入编号" }]}>
                  <Input />
               </Form.Item>
               <Form.Item label='名称' name='name' rules={[{ required: true, message: "请输入名称" }]}>
                  <Input />
               </Form.Item>
               <Form.Item label='IP地址' name='ip' rules={[{ required: true, message: "请输入IP地址" }]}>
                  <Input />
               </Form.Item>
               <Form.Item label='雷达编号' name='radarId' rules={[{ required: true, message: "请输入雷达编号" }]}>
                  <Input />
               </Form.Item>
               <Form.Item label='启用监测' name='enabled' valuePropName='checked'>
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
      </div>
   );
};

export default RoomManagement;
