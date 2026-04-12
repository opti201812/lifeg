// components/RadarManagement/index.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Table, Button, message, Space, Modal } from "antd";
import axios from "axios";
import config from "../../config";
import AddEditRadarModal from "./AddEditRadarModal";

interface Radar {
   id: number;
   person_pose: string;
   targetDistance?: number | null; // 目标距离
   enabled?: boolean;
   remark?: string;
   createdAt?: string;
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
         // 获取每个雷达的目标距离
         const radarsData = response.data?.data || response.data || [];
         const radarsWithDistance = await Promise.all(
            radarsData.map(async (radar: Radar) => {
               try {
                  const distanceResponse = await axios.get(`${config.backend.url}/radar/${radar.id}/target-distance`);
                  return {
                     ...radar,
                     targetDistance: distanceResponse.data?.data?.targetDistance ?? null,
                  };
               } catch {
                  return { ...radar, targetDistance: null };
               }
            }),
         );
         setRadars(radarsWithDistance);
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
         onOk: () => new Promise<void>((resolve, reject) => {
            axios.delete(`${config.backend.url}/rooms/radars/${id}`)
               .then(() => {
                  message.success("删除雷达成功！");
                  fetchData();
                  resolve();
               })
               .catch((error: any) => {
                  const errorMsg = error.response?.data?.error || "删除雷达失败！请检查雷达是否已被关联？";
                  message.error(errorMsg);
                  resolve(); // 不reject，直接关闭对话框
               });
         }),
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
      {
         title: "目标距离",
         key: "targetDistance",
         render: (_: any, record: Radar) => (record.targetDistance != null ? `${record.targetDistance} 米` : "未配置"),
      },
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
