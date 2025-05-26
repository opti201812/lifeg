import React, { useState, useEffect, useCallback } from "react";
import { Table, Button, message, Space } from "antd";
import axios from "axios";
import config from "../../config";
import AddEditRoomTypeModal from "./AddEditRoomTypeModal";
import { RoomType } from "../../types";

const RoomTypeManagement: React.FC = () => {
   const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
   const [roomTemplates, setRoomTemplates] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);
   const [isModalVisible, setIsModalVisible] = useState(false);
   const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);
   const [isEditing, setIsEditing] = useState(false);

   const fetchData = useCallback(async () => {
      setLoading(true);
      try {
         const initDataResponse = await axios.get(`${config.backend.url}/rooms/init-data/`);

         setRoomTypes(initDataResponse.data.data.roomTypes);
         setRoomTemplates(initDataResponse.data.data.templates);
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

   const handleDeleteRoomType = async (id: number) => {
      try {
         await axios.delete(`${config.backend.url}/rooms/types/${id}`);
         message.success("删除房间类型成功！");
         fetchData();
      } catch (error) {
         console.error("Error deleting room type:", error);
         message.error("删除房间类型失败！");
      }
   };

   const showModal = (roomType: RoomType | null) => {
      if (roomType) {
         setIsEditing(true);
         setEditingRoomType(roomType);
      } else {
         setIsEditing(false);
         setEditingRoomType(null);
      }
      setIsModalVisible(true);
   };

   const columns = [
      { title: "编号", dataIndex: "typeId", key: "typeId" },
      { title: "类型名称", dataIndex: "typeName", key: "typeName" },
      {
         title: "模板类型",
         dataIndex: "templateId",
         key: "templateId",
         render: (templateId: number) => {
            const template = roomTemplates.find((t) => t.templateId === templateId);
            return template ? template.templateName : "未知模板";
         },
      },
      {
         title: "雷达最大数量",
         key: "maxRadars",
         render: (_: any, record: RoomType) => {
            const template = roomTemplates.find((t) => t.templateId === record.templateId);
            return template ? template.maxRadars : "未知";
         },
      },
      {
         title: "人员最大数量",
         key: "maxPersonnel",
         render: (_: any, record: RoomType) => {
            const template = roomTemplates.find((t) => t.templateId === record.templateId);
            return template ? template.maxPersonnel : "未知";
         },
      },
      {
         title: "操作",
         key: "action",
         render: (_: any, record: RoomType) => (
            <Space size='middle'>
               <Button onClick={() => showModal(record)}>编辑</Button>
               <Button danger onClick={() => handleDeleteRoomType(record.typeId)}>
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
               新增房间类型
            </Button>
         </div>
         <Table columns={columns} dataSource={roomTypes} rowKey='typeId' loading={loading} />
         <AddEditRoomTypeModal
            isVisible={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            editingRoomType={editingRoomType}
            isEditing={isEditing}
            roomTemplates={roomTemplates}
            onSuccess={fetchData}
         />
      </div>
   );
};

export default RoomTypeManagement;
