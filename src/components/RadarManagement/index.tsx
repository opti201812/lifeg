// components/RadarManagement/index.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Table, Button, message, Space, Modal } from "antd";
import axios from "axios";
import config from "../../config";
import AddEditRadarModal from "./AddEditRadarModal";

interface Radar {
   id: number;
   person_pose: string;
   distance: number;
   remark?: string;
}

const RadarManagement: React.FC = () => {
   const [radars, setRadars] = useState<Radar[]>([]);
   const [loading, setLoading] = useState(false);
   const [isModalVisible, setIsModalVisible] = useState(false);
   const [editingRadar, setEditingRadar] = useState<Radar | null>(null);
   const [isEditing, setIsEditing] = useState(false);

   const fetchData = useCallback(async () => {
      setLoading(true);
      try {
         const response = await axios.get(`${config.backend.url}/rooms/radars`);
         setRadars(response.data);
      } catch (error) {
         console.error("Error fetching radars:", error);
         message.error("获取雷达数据失败！");
      } finally {
         setLoading(false);
      }
   }, []);

   useEffect(() => {
      fetchData();
   }, [fetchData]);

   const handleDeleteRadar = async (id: number) => {
      Modal.confirm({
         title: "确认删除",
         content: "确定要删除此雷达吗？",
         okText: "确认",
         cancelText: "取消",
         onOk: async () => {
            try {
               await axios.delete(`${config.backend.url}/rooms/radars/${id}`);
               message.success("删除雷达成功！");
               fetchData();
            } catch (error) {
               console.error("Error deleting radar:", error);
               message.error("删除雷达失败！请检查雷达是否已被关联？");
            }
         },
      });
   };

   const showModal = (radar: Radar | null) => {
      if (radar) {
         setIsEditing(true);
         setEditingRadar(radar);
      } else {
         setIsEditing(false);
         setEditingRadar(null);
      }
      setIsModalVisible(true);
   };

   const columns = [
      { title: "雷达ID", dataIndex: "id", key: "id" },
      { title: "人员姿态", dataIndex: "person_pose", key: "person_pose" },
      { title: "距离", dataIndex: "distance", key: "distance", render: (distance: number) => `${distance} 米` },
      { title: "备注", dataIndex: "remark", key: "remark", render: (remark?: string) => remark || "-" },
      {
         title: "操作",
         key: "action",
         render: (_: any, record: Radar) => (
            <Space size='middle'>
               <Button onClick={() => showModal(record)}>编辑</Button>
               <Button danger onClick={() => handleDeleteRadar(record.id)}>
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
               新增雷达
            </Button>
         </div>
         <Table columns={columns} dataSource={radars} rowKey='id' loading={loading} />
         <AddEditRadarModal
            isVisible={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            editingRadar={editingRadar}
            isEditing={isEditing}
            onSuccess={fetchData}
         />
      </div>
   );
};

export default RadarManagement;
