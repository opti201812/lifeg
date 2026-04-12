import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { message } from "antd";
import { useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { usePersonnelData } from "./hooks/usePersonnelData";
import { useRoomData } from "./hooks/useRoomData";
import { useDataRefresh } from "./hooks/useDataRefresh";
import { SelectedRoom, RoomPersonnel } from "./types";
import RoomHeader from "./components/RoomHeader";
import TabView from "./components/TabView";
import RoomPage from "../../pages/Room";
import ArmPersonnelModal from "../ArmPersonnelModal";
import PerformanceMonitor from "../PerformanceMonitor";
import "./styles.css";

interface OverviewProps {
   roomId?: string;
}

const Overview: React.FC<OverviewProps> = () => {
   const { roomId } = useParams<{ roomId: string }>();

   // 页面状态
   const [activeTab, setActiveTab] = useState<string>("card");
   const [isArmModalVisible, setIsArmModalVisible] = useState(false);
   const [armModalInitValues, setArmModalInitValues] = useState<{ roomId?: number }>({});
   const [selectedRoom, setSelectedRoom] = useState<SelectedRoom | null>(null);

   // 从Redux store获取rooms数据
   const rooms = useSelector((state: RootState) => state.data.rooms);
   const associations = useSelector((state: RootState) => state.data.associations);
   const personnel = useSelector((state: RootState) => state.data.personnel);

   // 使用自定义hooks
   const { loading, showPersonnelName, currentRoom, fetchData, fetchRoomInfo } = useRoomData();
   const { allRoomPersonnel, rawData } = usePersonnelData(roomId);

   // 🔥 稳定 props 引用，避免不必要的重新渲染
   // 使用 useMemo 稳定 allRoomPersonnel 引用（基于人员ID列表和长度）
   // 🔥 修复：先计算ID列表字符串，然后基于字符串稳定引用
   const currentPersonnelIdsKey = useMemo(() => {
      return allRoomPersonnel
         .map((p) => p.personnel?.id)
         .filter((id): id is number => id !== undefined)
         .join(",");
   }, [allRoomPersonnel]);

   // 🔥 使用 ref 追踪上一次的ID列表，只在真正变化时更新
   const prevPersonnelIdsKeyRef = useRef<string>("");
   const personnelIdsKey = useMemo(() => {
      // 如果ID列表没变，返回上一次的key（保持引用稳定）
      if (currentPersonnelIdsKey === prevPersonnelIdsKeyRef.current) {
         return prevPersonnelIdsKeyRef.current;
      }

      // ID列表变化了，更新ref并返回新的key
      prevPersonnelIdsKeyRef.current = currentPersonnelIdsKey;
      return currentPersonnelIdsKey;
   }, [currentPersonnelIdsKey]);

   // 🔥 关键修复：生成基于数据内容的key，确保数据更新时重新渲染
   const allRoomPersonnelDataKey = useMemo(() => {
      // 基于所有人员的关键数据生成一个key，确保数据变化时重新渲染
      return allRoomPersonnel
         .map((rp) => {
            if (!rp.personnel || !rp.deviceInfo) return "";
            const di = rp.deviceInfo;
            // 使用关键字段生成key，包括所有实时更新的字段（与显示的字段保持一致）
            return `${rp.personnel.id}:${di.heartRate}:${di.breathRate}:${di.distance}:${di.braceletHeartRate}:${di.spo2}:${di.systolicPressure}:${di.diastolicPressure}:${di.bodyTemperature}`;
         })
         .join("|");
   }, [allRoomPersonnel]);

   const stableAllRoomPersonnel = useMemo(() => {
      return allRoomPersonnel;
   }, [
      // 🔥 关键修复：使用数据内容key，确保数据更新时重新渲染
      allRoomPersonnelDataKey,
      // 如果数组长度变化，也需要更新
      allRoomPersonnel.length,
   ]);

   // 🔥 稳定数组 props 引用（基于长度）
   const stableAlarms = useMemo(() => rawData.alarms, [rawData.alarms.length]);
   const stableAssociations = useMemo(() => rawData.associations, [rawData.associations.length]);
   const stableRoomTypes = useMemo(() => rawData.roomTypes, [rawData.roomTypes.length]);
   const stableRoomTemplates = useMemo(() => rawData.roomTemplates, [rawData.roomTemplates.length]);
   const stableRooms = useMemo(() => rooms, [rooms.length]);

   // 🔥 关键修复：初始化数据加载
   // 使用 ref 标记是否已经初始化，避免重复加载
   const hasInitializedRef = useRef(false);

   useEffect(() => {
      // 只在首次挂载且数据为空时加载
      if (!hasInitializedRef.current) {
         hasInitializedRef.current = true;

         // 检查关键数据是否为空
         const hasEmptyData = rooms.length === 0 || associations.length === 0 || personnel.length === 0;

         if (hasEmptyData) {
            fetchData();
         } else {
            console.debug("[Overview] 数据已存在，无需重新加载", {
               rooms: rooms.length,
               associations: associations.length,
               personnel: personnel.length,
            });
         }
      }
   }, [fetchData, rooms.length, associations.length, personnel.length]);

   // 获取单个房间信息
   useEffect(() => {
      if (roomId) {
         fetchRoomInfo(roomId);
      }
   }, [roomId, fetchRoomInfo]);

   // 处理设防对话框
   const handleArm = useCallback((roomId: number) => {
      setArmModalInitValues({ roomId });
      setIsArmModalVisible(true);
   }, []);

   // 处理设防表单提交
   const handleArmSubmit = useCallback(
      async (values: any) => {
         try {
            setIsArmModalVisible(false);
            fetchData(); // 刷新数据
         } catch (error) {
            console.error("设防失败:", error);
            message.error("设防失败，请稍后重试");
         }
      },
      [fetchData],
   );

   // 处理卡片点击
   const handleCardClick = useCallback((roomPersonnel: RoomPersonnel) => {
      if (roomPersonnel.personnel) {
         setSelectedRoom({
            roomId: roomPersonnel.room.id,
            roomInfo: {
               name: roomPersonnel.personnel.name,
               age: roomPersonnel.personnel.age || 0,
               gender: roomPersonnel.personnel.gender || "",
               personnelId: roomPersonnel.personnel.id,
            },
            associationId: roomPersonnel.associationId,
            initialSlide: 0,
         });
      }
   }, []);

   // 处理日曲线点击
   const handleDayCurveClick = useCallback((roomPersonnel: RoomPersonnel, event: React.MouseEvent) => {
      event.stopPropagation();
      if (roomPersonnel.personnel) {
         setSelectedRoom({
            roomId: roomPersonnel.room.id,
            roomInfo: {
               name: roomPersonnel.personnel.name,
               age: roomPersonnel.personnel.age || 0,
               gender: roomPersonnel.personnel.gender || "",
               personnelId: roomPersonnel.personnel.id,
            },
            associationId: roomPersonnel.associationId,
            initialSlide: 1,
         });
      }
   }, []);

   // 处理周曲线点击
   const handleWeekCurveClick = useCallback((roomPersonnel: RoomPersonnel, event: React.MouseEvent) => {
      event.stopPropagation();
      if (roomPersonnel.personnel) {
         setSelectedRoom({
            roomId: roomPersonnel.room.id,
            roomInfo: {
               name: roomPersonnel.personnel.name,
               age: roomPersonnel.personnel.age || 0,
               gender: roomPersonnel.personnel.gender || "",
               personnelId: roomPersonnel.personnel.id,
            },
            associationId: roomPersonnel.associationId,
            initialSlide: 2,
         });
      }
   }, []);

   // 处理查看详情
   const handleViewDetails = useCallback((record: RoomPersonnel) => {
      if (record.personnel) {
         setSelectedRoom({
            roomId: record.room.id,
            roomInfo: {
               name: record.personnel.name,
               age: record.personnel.age || 0,
               gender: record.personnel.gender || "",
               personnelId: record.personnel.id,
            },
            associationId: record.associationId,
            initialSlide: 0,
         });
      }
   }, []);

   // 返回总览
   const handleBackToOverview = useCallback(() => {
      setSelectedRoom(null);
   }, []);

   // 渲染内容区域
   const renderContent = () => {
      if (selectedRoom) {
         return (
            <RoomPage
               personnelId={selectedRoom.roomInfo.personnelId!}
               roomId={selectedRoom.roomId}
               associationId={selectedRoom.associationId}
               initialSlide={selectedRoom.initialSlide}
            />
         );
      }

      return (
         <TabView
            activeTab={activeTab}
            onTabChange={setActiveTab}
            allRoomPersonnel={stableAllRoomPersonnel}
            showPersonnelName={showPersonnelName}
            alarms={stableAlarms}
            associations={stableAssociations}
            roomTypes={stableRoomTypes}
            roomTemplates={stableRoomTemplates}
            rooms={stableRooms}
            loading={loading}
            onCardClick={handleCardClick}
            onDayCurveClick={handleDayCurveClick}
            onWeekCurveClick={handleWeekCurveClick}
            onAddPersonnel={handleArm}
            onViewDetails={handleViewDetails}
         />
      );
   };

   return (
      <div className='overview-container'>
         <RoomHeader currentRoom={currentRoom} selectedRoom={selectedRoom} onBackToOverview={handleBackToOverview} />

         {renderContent()}

         <ArmPersonnelModal
            visible={isArmModalVisible}
            entryType='ROOM_OVERVIEW'
            initialValues={armModalInitValues}
            onCancel={() => setIsArmModalVisible(false)}
            onSubmit={handleArmSubmit}
         />

         {/* 性能监控组件（仅开发环境显示） */}
         {process.env.NODE_ENV === "development" && <PerformanceMonitor />}
      </div>
   );
};

export default Overview;
