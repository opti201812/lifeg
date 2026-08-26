import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { message } from "antd";
import { useParams, useLocation, useNavigate } from "react-router-dom";
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
   const navigate = useNavigate();

   // 当前登录用户角色与房间归属：user 角色仅能查看/管理自己房间
   const userRole = useSelector((state: RootState) => state.user.role);
   const userRoomId = useSelector((state: RootState) => state.user.room_id);

   // user 角色强制只看自己房间：忽略 URL 中传入的 roomId
   // 未绑定房间时用 "-1"（不匹配任何房间）保证不过滤出全部房间，而是显示空
   const effectiveRoomId =
      userRole === "admin" ? roomId : userRoomId != null ? String(userRoomId) : "-1";

   // 规范化 URL：user 必须停留在自己的房间页，内部组件（如 CurveView 曲线加载）
   // 依赖 URL 中的 roomId，若 URL 与归属房间不一致则就地替换，避免拉到别的房间数据
   useEffect(() => {
      if (userRole === "user" && userRoomId != null && roomId !== String(userRoomId)) {
         navigate(`/dashboard/overview/${userRoomId}`, { replace: true });
      }
   }, [userRole, userRoomId, roomId, navigate]);

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
   const { allRoomPersonnel, rawData } = usePersonnelData(effectiveRoomId);

   // user 角色仅查看本房间且无分配权限：过滤掉“添加人员”空位卡片（sortType 3）
   const visibleRoomPersonnel = useMemo(() => {
      if (userRole === "admin") return allRoomPersonnel;
      return allRoomPersonnel.filter((rp) => rp.sortType !== 3);
   }, [allRoomPersonnel, userRole]);

   // 🔥 稳定 props 引用，避免不必要的重新渲染
   // 使用 useMemo 稳定 allRoomPersonnel 引用（基于人员ID列表和长度）
   // 🔥 修复：先计算ID列表字符串，然后基于字符串稳定引用
   const currentPersonnelIdsKey = useMemo(() => {
      return visibleRoomPersonnel
         .map((p) => p.personnel?.id)
         .filter((id): id is number => id !== undefined)
         .join(",");
   }, [visibleRoomPersonnel]);

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
      return visibleRoomPersonnel
         .map((rp) => {
            if (!rp.personnel || !rp.deviceInfo) return "";
            const di = rp.deviceInfo;
            // 使用关键字段生成key，包括所有实时更新的字段（与显示的字段保持一致）
            return `${rp.personnel.id}:${di.heartRate}:${di.breathRate}:${di.distance}:${di.braceletHeartRate}:${di.spo2}:${di.systolicPressure}:${di.diastolicPressure}:${di.bodyTemperature}`;
         })
         .join("|");
   }, [visibleRoomPersonnel]);

   const stableAllRoomPersonnel = useMemo(() => {
      return visibleRoomPersonnel;
   }, [
      // 🔥 关键修复：使用数据内容key，确保数据更新时重新渲染
      allRoomPersonnelDataKey,
      // 如果数组长度变化，也需要更新
      visibleRoomPersonnel.length,
   ]);

   // 🔥 稳定数组 props 引用（基于长度）
   const stableAlarms = useMemo(() => rawData.alarms, [rawData.alarms.length]);
   const stableAssociations = useMemo(() => rawData.associations, [rawData.associations.length]);
   const stableRoomTypes = useMemo(() => rawData.roomTypes, [rawData.roomTypes.length]);
   const stableRoomTemplates = useMemo(() => rawData.roomTemplates, [rawData.roomTemplates.length]);
   // user 角色只展示自己房间：rooms 列表同样过滤，避免报警等 Tab 拉到其他房间信息
   const stableRooms = useMemo(() => {
      if (userRole === "admin") return rooms;
      return rooms.filter((room) => String(room.id) === String(userRoomId ?? ""));
   }, [rooms, userRole, userRoomId]);

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

   // 处理设防对话框（user 角色无分配/设防权限，直接拒绝）
   const handleArm = useCallback(
      (roomId: number) => {
         if (userRole !== "admin") {
            message.warning("当前账号无设防权限");
            return;
         }
         setArmModalInitValues({ roomId });
         setIsArmModalVisible(true);
      },
      [userRole]
   );

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

         {userRole === "admin" && (
            <ArmPersonnelModal
               visible={isArmModalVisible}
               entryType='ROOM_OVERVIEW'
               initialValues={armModalInitValues}
               onCancel={() => setIsArmModalVisible(false)}
               onSubmit={handleArmSubmit}
            />
         )}

         {/* 性能监控组件（仅开发环境显示） */}
         {process.env.NODE_ENV === "development" && <PerformanceMonitor />}
      </div>
   );
};

export default Overview;
