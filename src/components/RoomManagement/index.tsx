import React, { useState, useEffect, useCallback } from "react";
import { Table, Button, message, Space, Modal } from "antd";
import axios from "axios";
import { useDispatch } from "react-redux";
import config from "../../config";
import AddEditRoomModal from "./AddEditRoomModal";
import { setRooms as setRoomsToStore } from "../../store/dataSlice";
import { Room, RoomType } from "../../types";

const RoomManagement: React.FC = () => {
   const [rooms, setRooms] = useState<Room[]>([]);
   const dispatch = useDispatch();
   const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
   const [roomTemplates, setRoomTemplates] = useState<any[]>([]);
   const [availableRadars, setAvailableRadars] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);
   const [isModalVisible, setIsModalVisible] = useState(false);
   const [editingRoom, setEditingRoom] = useState<Room | null>(null);
   const [isEditing, setIsEditing] = useState(false);
   const confirmModalRef = React.useRef<ReturnType<typeof Modal.confirm> | null>(null);

   const fetchData = useCallback(async () => {
      setLoading(true);
      try {
         // 获取房间和初始化数据
         const roomsResponse = await axios.get(`${config.backend.url}/rooms`);
         const initDataResponse = await axios.get(`${config.backend.url}/rooms/init-data/`);

         // 获取可用雷达列表
         const radarsResponse = await axios.get(`${config.backend.url}/rooms/radars`);

         const roomsData = roomsResponse.data?.data || roomsResponse.data || [];
         setRooms(roomsData);
         dispatch(setRoomsToStore(roomsData)); // 同步到 redux，供侧边栏/总览即时更新
         setRoomTypes(initDataResponse.data.data.roomTypes);
         setRoomTemplates(initDataResponse.data.data.templates);

         // 收集所有已分配给房间的雷达ID
         // 由于后端改为了存储纯数字数组，需要直接使用radars数组
         const usedRadarIds = roomsData.flatMap((room: Room) =>
            Array.isArray(room.radars) ? room.radars : []
         );

         // 过滤出未分配的雷达
         const radarsData = radarsResponse.data?.data || radarsResponse.data || [];
         const availableRadarsList = radarsData.filter((radar: any) => !usedRadarIds.includes(radar.id));

         setAvailableRadars(availableRadarsList);
      } catch (error) {
         console.error("Error fetching data:", error);
         message.error("获取数据失败！");
      } finally {
         setLoading(false);
      }
   }, []);

   useEffect(() => {
      fetchData();
   }, [fetchData]);

   const handleDeleteRoom = async (id: number) => {
      try {
         await new Promise((resolve, reject) => {
            confirmModalRef.current = Modal.confirm({
               title: "确认删除",
               content: "确定要删除此房间吗？",
               okText: "确认",
               cancelText: "取消",
               onOk: resolve,
               onCancel: () => reject(new Error("用户取消操作")),
            });
         });
         await axios.delete(`${config.backend.url}/rooms/${id}`);
         confirmModalRef.current?.destroy();
         message.success("删除房间成功！");
         fetchData();
      } catch (error) {
         if (error instanceof Error && error.message !== "用户取消操作") {
            console.error("Error deleting room:", error);
            message.error("删除房间失败！");
         }
      }
   };

   const showModal = (room: Room | null) => {
      if (room) {
         setIsEditing(true);
         setEditingRoom(room);
      } else {
         setIsEditing(false);
         setEditingRoom(null);
      }
      setIsModalVisible(true);
   };

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
         title: "雷达最大数量",
         key: "maxRadars",
         render: (_: any, record: Room) => {
            const roomType = roomTypes.find((t) => t.typeId === record.typeId);
            if (!roomType) return "未知";

            const template = roomTemplates.find((t) => t.templateId === roomType.templateId);
            return template ? template.maxRadars : "未知";
         },
      },
      {
         title: "人员最大数量",
         key: "maxPersonnel",
         render: (_: any, record: Room) => {
            const roomType = roomTypes.find((t) => t.typeId === record.typeId);
            if (!roomType) return "未知";

            const template = roomTemplates.find((t) => t.templateId === roomType.templateId);
            return template ? template.maxPersonnel : "未知";
         },
      },
      {
         title: "备注",
         dataIndex: "remark",
         key: "remark",
         render: (remark: string) => remark || "-",
      },
      {
         title: "操作",
         key: "action",
         render: (_: any, record: Room) => (
            <Space size='middle'>
               <Button onClick={() => showModal(record)}>编辑</Button>
               <Button danger onClick={() => handleDeleteRoom(record.id)}>
                  删除
               </Button>
            </Space>
         ),
      },
   ];

   return (
      <div style={{ padding: 24 }}>
         <div style={{ marginBottom: 16 }}>
            <Button type='primary' onClick={() => showModal(null)}>
               新增房间
            </Button>
         </div>
         <Table columns={columns} dataSource={rooms} rowKey='id' loading={loading} />
         <AddEditRoomModal
            isVisible={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            editingRoom={editingRoom}
            isEditing={isEditing}
            roomTypes={roomTypes}
            roomTemplates={roomTemplates}
            availableRadars={availableRadars}
            onSuccess={fetchData}
         />
      </div>
   );
};

export default RoomManagement;
