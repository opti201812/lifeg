import React, { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import { useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { usePersonnelData } from "../NewOverview/hooks/usePersonnelData";
import { useRoomData } from "../NewOverview/hooks/useRoomData";
import { useDataRefresh } from "../NewOverview/hooks/useDataRefresh";
import { SelectedRoom, RoomPersonnel } from "../NewOverview/types";
import RoomHeader from "../NewOverview/components/RoomHeader";
import TabView from "./components/TabView";
import RoomPage from "../../pages/Room";
import ArmPersonnelModal from "../ArmPersonnelModal";
import "./styles.css";

interface OverviewProps {
   roomId?: string;
}

const Overview: React.FC<OverviewProps> = () => {
   const { roomId } = useParams<{ roomId: string }>();

   // 页面状态
   const [activeTab, setActiveTab] = useState<string>("curve");
   const [isArmModalVisible, setIsArmModalVisible] = useState(false);
   const [armModalInitValues, setArmModalInitValues] = useState<{ roomId?: number }>({});
   const [selectedRoom, setSelectedRoom] = useState<SelectedRoom | null>(null);

   // 从Redux store获取rooms数据
   const rooms = useSelector((state: RootState) => state.data.rooms);

   // 使用自定义hooks
   const { loading, showPersonnelName, currentRoom, fetchData, fetchRoomInfo } = useRoomData();
   const { allRoomPersonnel, rawData } = usePersonnelData(roomId);

   // 初始化数据加载
   useEffect(() => {
      fetchData();
   }, [fetchData]);

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
      [fetchData]
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
            allRoomPersonnel={allRoomPersonnel}
            showPersonnelName={showPersonnelName}
            alarms={rawData.alarms}
            associations={rawData.associations}
            roomTypes={rawData.roomTypes}
            roomTemplates={rawData.roomTemplates}
            rooms={rooms}
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
      </div>
   );
};

export default Overview;
