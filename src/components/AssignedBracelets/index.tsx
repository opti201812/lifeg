import React, { useEffect, useState } from "react";
import { Table, Button, Tag, message, Spin, Modal } from "antd";
import axios from "axios";
import config from "../../config";
import { useNavigate } from "react-router-dom";
import { getBatteryStatus } from "../../utils";
import BraceletTable from "../common/BraceletTable";
import ArmPersonnelModal from "../ArmPersonnelModal";

interface Bracelet {
   id: string;
   online: boolean;
   assigned: boolean;
   personnelId?: number;
   personnelName?: string;
   roomId?: number;
   roomName?: string;
   battery?: number;
   lastUpdate?: number;
   associationId?: number;
}

const AssignedBracelets: React.FC = () => {
   const [bracelets, setBracelets] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [modalVisible, setModalVisible] = useState(false);
   const [selectedBracelet, setSelectedBracelet] = useState<any>(null);
   const [personnel, setPersonnel] = useState<{ [key: number]: any }>({});
   const [rooms, setRooms] = useState<{ [key: number]: any }>({});
   const navigate = useNavigate();

   useEffect(() => {
      const fetchBracelets = async () => {
         try {
            setLoading(true);

            // 获取手环数据
            const braceletResponse = await axios.get(`${config.backend.url}/rooms/bracelets`);

            // 获取关联数据，用于判断手环是否已分配
            const associationsResponse = await axios.get(`${config.backend.url}/associations`);

            // 获取人员数据
            const personnelResponse = await axios.get(`${config.backend.url}/personnel`);

            // 获取房间数据
            const roomsResponse = await axios.get(`${config.backend.url}/rooms`);

            // 确保 associations 是数组
            const associations = Array.isArray(associationsResponse.data?.data)
               ? associationsResponse.data.data
               : Array.isArray(associationsResponse.data)
               ? associationsResponse.data
               : [];

            // 创建人员映射
            const personnelMap: { [key: number]: any } = {};
            personnelResponse.data.forEach((person: any) => {
               personnelMap[person.id] = person;
            });
            setPersonnel(personnelMap);

            // 创建房间映射
            const roomsMap: { [key: number]: any } = {};
            roomsResponse.data.forEach((room: any) => {
               roomsMap[room.id] = room;
            });
            setRooms(roomsMap);

            // 处理CSM API返回的数据
            const braceletData = braceletResponse.data || {};
            const onlineBracelets = braceletData.onlineBracelets || [];
            const offlineBracelets = braceletData.offlineBracelets || [];

            // 合并在线和离线手环
            const allBracelets = [...onlineBracelets, ...offlineBracelets];

            // 转换数据格式并过滤已分配的手环
            const formattedBracelets = allBracelets
               .map((bracelet: any) => {
                  const id = bracelet.deviceId?.toString();
                  const association = associations.find((a: any) => a.braceletId === id);
                  let armed = false;

                  if (association) {
                     armed = !!association.roomId;
                     return {
                        id,
                        online: bracelet.isOnline === true,
                        assigned: true,
                        armed,
                        personnelId: association.personnelId,
                        personnelName: personnelMap[association.personnelId]?.name || "未知",
                        roomId: association.roomId,
                        roomName: roomsMap[association.roomId]?.name || "未知",
                        battery: bracelet.data?.batteryVoltage,
                        lastUpdate: bracelet.lastUpdateTime,
                        associationId: association.id,
                     };
                  }

                  return {
                     id,
                     online: bracelet.isOnline === true,
                     assigned: false,
                     armed: false,
                  };
               })
               .filter((b) => b.assigned && !b.armed); // 过滤出已分配的手环

            setBracelets(formattedBracelets);
         } catch (error) {
            console.error("获取手环列表失败:", error);
            message.error("获取手环列表失败");
            setBracelets([]);
         } finally {
            setLoading(false);
         }
      };

      fetchBracelets();
   }, []);

   const handleAction = async (type: string, record: any) => {
      if (type === "reclaim") {
         Modal.confirm({
            title: "确认收回手环？",
            onOk: async () => {
               try {
                  // 直接使用关联ID删除
                  await axios.delete(`${config.backend.url}/associations/${record.associationId}`);

                  message.success("手环收回成功");
                  // 刷新数据
                  const fetchData = async () => {
                     try {
                        setLoading(true);
                        const braceletResponse = await axios.get(`${config.backend.url}/rooms/bracelets`);
                        const associationsResponse = await axios.get(`${config.backend.url}/associations`);
                        const personnelResponse = await axios.get(`${config.backend.url}/personnel`);
                        const roomsResponse = await axios.get(`${config.backend.url}/rooms`);

                        const associations = Array.isArray(associationsResponse.data?.data)
                           ? associationsResponse.data.data
                           : Array.isArray(associationsResponse.data)
                           ? associationsResponse.data
                           : [];

                        const personnelMap: { [key: number]: any } = {};
                        personnelResponse.data.forEach((person: any) => {
                           personnelMap[person.id] = person;
                        });
                        setPersonnel(personnelMap);

                        const roomsMap: { [key: number]: any } = {};
                        roomsResponse.data.forEach((room: any) => {
                           roomsMap[room.id] = room;
                        });
                        setRooms(roomsMap);

                        const braceletData = braceletResponse.data || {};
                        const onlineBracelets = braceletData.onlineBracelets || [];
                        const offlineBracelets = braceletData.offlineBracelets || [];
                        const allBracelets = [...onlineBracelets, ...offlineBracelets];

                        const formattedBracelets = allBracelets
                           .map((bracelet: any) => {
                              const id = bracelet.deviceId?.toString();
                              const association = associations.find((a: any) => a.braceletId === id);

                              if (association) {
                                 return {
                                    id,
                                    online: bracelet.isOnline === true,
                                    assigned: true,
                                    personnelId: association.personnelId,
                                    personnelName: personnelMap[association.personnelId]?.name || "未知",
                                    roomId: association.roomId,
                                    roomName: roomsMap[association.roomId]?.name || "未知",
                                    battery: bracelet.data?.batteryVoltage,
                                    lastUpdate: bracelet.lastUpdateTime,
                                    associationId: association.id,
                                 };
                              }

                              return {
                                 id,
                                 online: bracelet.isOnline === true,
                                 assigned: false,
                              };
                           })
                           .filter((b: Bracelet) => b.assigned);

                        setBracelets(formattedBracelets);
                     } catch (error) {
                        console.error("获取手环列表失败:", error);
                        message.error("获取手环列表失败");
                        setBracelets([]);
                     } finally {
                        setLoading(false);
                     }
                  };

                  await fetchData();
               } catch (error) {
                  console.error("收回手环失败:", error);
                  message.error("收回手环失败");
               }
            },
         });
      } else if (type === "arm") {
         setSelectedBracelet(record);
         setModalVisible(true);
      }
   };

   return (
      <div style={{ padding: 24 }}>
         <h1>已分配手环列表</h1>
         {loading ? (
            <div style={{ textAlign: "center", margin: "50px 0" }}>
               <Spin size='large' />
               <p style={{ marginTop: 16 }}>加载手环数据中...</p>
            </div>
         ) : (
            <BraceletTable data={bracelets} loading={loading} actionType='assigned' onAction={handleAction} />
         )}

         <ArmPersonnelModal
            visible={modalVisible}
            initialValues={{
               braceletId: selectedBracelet?.id,
               // personnelId: selectedBracelet?.personnelId,
               roomId: selectedBracelet?.roomId,
            }}
            onCancel={() => setModalVisible(false)}
            onSubmit={(values) => {
               console.log("设防操作:", values);
               setModalVisible(false);
            }}
         />
      </div>
   );
};

export default AssignedBracelets;
