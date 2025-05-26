// components/RoomManagement/index.tsx

import React, { useState, useCallback, useEffect } from "react";
import { Table, Button, message, Form, Modal } from "antd";
import { settingSpace } from "../../styles/theme";
import { Personnel, Radar, Room, TemplateType, RoomType, RadarConfig } from "../../types";
import axios from "axios";
import config from "../../config";
import { useDispatch, useSelector } from "react-redux";
import { setRooms } from "../../store/dataSlice";
import { RootState } from "../../store";
import AddEditRoomModal from "./AddEditRoomModal";

const RoomManagement: React.FC = () => {
   const rooms = useSelector((state: RootState) => state.data.rooms);
   const [isModalVisible, setIsModalVisible] = useState(false);
   const [editingRoom, setEditingRoom] = useState<Room | null>(null);
   const [isEditing, setIsEditing] = useState(false);
   const [roomTemplates, setRoomTemplates] = useState<
      {
         templateId: number;
         templateName: string;
         maxRadars: number;
         maxBracelets: number;
         maxPersonnel: number;
      }[]
   >([]);
   const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
   const dispatch = useDispatch();

   // 获取房间列表
   useEffect(() => {
      const fetchRooms = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/rooms`);
            const roomsData = response.data.map((room: Room) => ({
               ...room,
               mattress_distance: room.mattress_distance !== undefined && room.mattress_distance / 100,
            }));
            dispatch(setRooms(roomsData || []));
         } catch (error) {
            console.error("Error fetching rooms:", error);
            message.error("获取房间列表失败！");
         }
      };

      fetchRooms();
   }, []);

   const fetchInitData = useCallback(async () => {
      try {
         const response = await axios.get(`${config.backend.url}/rooms/init-data/`);
         const { roomTypes, templates } = response.data.data;

         // 更新房间类型和模板状态
         setRoomTypes(roomTypes);
         setRoomTemplates(templates);
      } catch (error) {
         console.error("Error fetching init data:", error);
         message.error("获取初始化数据失败！");
      }
   }, []);

   useEffect(() => {
      fetchInitData();
   }, [fetchInitData]);

   const showModal = useCallback((room: Room | null) => {
      if (room) {
         setIsEditing(true);
         setEditingRoom(room);
      } else {
         setIsEditing(false);
         setEditingRoom(null);
      }
      setIsModalVisible(true);
   }, []);

   const handleDeleteRoom = useCallback(
      async (id: number) => {
         Modal.confirm({
            title: "确认删除",
            content: "确定要删除该房间吗？",
            okText: "确认",
            cancelText: "取消",
            onOk: async () => {
               try {
                  await axios.delete(`${config.backend.url}/rooms/${id}`);
                  dispatch(setRooms(rooms.filter((r) => r.id !== id)));
                  message.success("删除房间成功");
               } catch (error) {
                  console.error("Error deleting room:", error);
                  message.error("删除房间失败！如房间内仍有人员，请先撤防");
               }
            },
         });
      },
      [rooms]
   );

   const columns = [
      { title: "编号", dataIndex: "id", key: "id" },
      { title: "名称", dataIndex: "name", key: "name" },
      {
         title: "房间类型",
         dataIndex: "typeId",
         key: "typeId",
         render: (typeId: number) => {
            const roomType = roomTypes.find((t) => t.typeId === typeId);
            return roomType ? roomType.typeName : "未知类型";
         },
      },
      {
         title: "雷达数量",
         key: "radars",
         render: (_: any, record: Room) => record.radars?.length || 0,
      },
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
         <Button type='primary' onClick={() => showModal(null)} style={{ marginBottom: 16 }}>
            新增房间
         </Button>
         <Table dataSource={rooms} columns={columns} rowKey='id' />

         {/* 新增/编辑房间模态框 */}
         <AddEditRoomModal
            isVisible={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            editingRoom={editingRoom}
            isEditing={isEditing}
            roomTypes={roomTypes}
            roomTemplates={roomTemplates}
         />
      </div>
   );
};

export default RoomManagement;
