import React, { useEffect, useState } from "react";
import { Table, Button, Tag, Form, Select, message, Spin } from "antd";
import axios from "axios";
import config from "../../config";
import { useNavigate } from "react-router-dom";
import ArmPersonnelModal from "../ArmPersonnelModal";
import { getBatteryStatus } from "../../utils";
import BraceletTable from "../common/BraceletTable";

interface Bracelet {
   id: string;
   online: boolean;
   assigned: boolean;
   currentRoom?: string | null;
   battery?: number;
   lastUpdate?: number;
}

interface Association {
   id: number;
   personnelId: number;
   braceletId: string;
   roomId: number;
}

const UnassignedBracelets: React.FC = () => {
   const [bracelets, setBracelets] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [modalVisible, setModalVisible] = useState(false);
   const [selectedBracelet, setSelectedBracelet] = useState<any>(null);
   const [modalType, setModalType] = useState<"assign" | "arm">("assign");
   const navigate = useNavigate();

   const fetchBracelets = async () => {
      try {
         setLoading(true);

         // 获取手环数据
         const braceletResponse = await axios.get(`${config.backend.url}/rooms/bracelets`);

         // 获取关联数据，用于判断手环是否已分配
         const associationsResponse = await axios.get(`${config.backend.url}/associations`);

         // 确保 associations 是数组
         const associations = Array.isArray(associationsResponse.data?.data)
            ? associationsResponse.data.data
            : Array.isArray(associationsResponse.data)
            ? associationsResponse.data
            : [];

         // 提取已分配的手环ID集合
         const assignedBraceletIds = new Set(
            associations
               .filter((a: any) => a.braceletId != null) // 过滤掉没有 braceletId 的项
               .map((a: any) => a.braceletId.toString()) // 转换为字符串
         );

         // 处理CSM API返回的数据
         const braceletData = braceletResponse.data || {};
         const onlineBracelets = braceletData.onlineBracelets || [];
         const offlineBracelets = braceletData.offlineBracelets || [];

         // 合并在线和离线手环
         const allBracelets = [...onlineBracelets, ...offlineBracelets];

         // 转换数据格式并过滤未分配的手环
         const formattedBracelets = allBracelets
            .map((bracelet: any) => ({
               id: bracelet.deviceId?.toString(),
               online: bracelet.isOnline === true,
               assigned: assignedBraceletIds.has(bracelet.deviceId?.toString()),
               currentRoom: null, // 未分配手环没有所在房间
               battery: bracelet.data?.batteryVoltage,
               lastUpdate: bracelet.lastUpdateTime,
            }))
            .filter((b: Bracelet) => !b.assigned); // 过滤出未分配的手环

         setBracelets(formattedBracelets);
      } catch (error) {
         console.error("获取手环列表失败:", error);
         message.error("获取手环列表失败");
         setBracelets([]);
      } finally {
         setLoading(false);
      }
   };
   useEffect(() => {
      fetchBracelets();
   }, [modalVisible]);

   const handleAction = async (type: any, record: any) => {
      setSelectedBracelet(record);
      setModalType(type);
      setModalVisible(true);
   };

   return (
      <div style={{ padding: 24 }}>
         <h1>未分配手环列表</h1>
         {loading ? (
            <div style={{ textAlign: "center", margin: "50px 0" }}>
               <Spin size='large' />
               <p style={{ marginTop: 16 }}>加载手环数据中...</p>
            </div>
         ) : (
            <BraceletTable data={bracelets} loading={loading} actionType='unassigned' onAction={handleAction} />
         )}

         <ArmPersonnelModal
            visible={modalVisible}
            entryType='UNASSIGNED_BRACELET'
            actionType={modalType}
            initialValues={{
               braceletId: selectedBracelet?.id,
               roomId: undefined,
            }}
            onCancel={() => setModalVisible(false)}
            onSubmit={(values) => {
               setModalVisible(false);
            }}
         />
      </div>
   );
};

export default UnassignedBracelets;
