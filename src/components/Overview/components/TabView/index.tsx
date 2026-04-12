import React, { useMemo, useState, useEffect, useRef } from "react";
import { Tabs, Spin } from "antd";
import { RoomPersonnel, Room } from "../../types";
import CardView from "../CardView";
import CurveView from "../CurveView";
import ReportView from "../ReportView";
import AlarmView from "../AlarmView";

interface TabViewProps {
   activeTab: string;
   onTabChange: (key: string) => void;
   allRoomPersonnel: (RoomPersonnel & { deviceInfo?: any; braceletStatus?: string; sortType?: number })[];
   showPersonnelName: boolean;
   alarms: any[];
   associations: any[];
   roomTypes: any[];
   roomTemplates: any[];
   rooms: Room[];
   loading: boolean;
   onCardClick: (roomPersonnel: RoomPersonnel) => void;
   onDayCurveClick: (roomPersonnel: RoomPersonnel, event: React.MouseEvent) => void;
   onWeekCurveClick: (roomPersonnel: RoomPersonnel, event: React.MouseEvent) => void;
   onAddPersonnel: (roomId: number) => void;
   onViewDetails: (record: RoomPersonnel) => void;
}

const TabView: React.FC<TabViewProps> = ({
   activeTab,
   onTabChange,
   allRoomPersonnel,
   showPersonnelName,
   alarms,
   associations,
   roomTypes,
   roomTemplates,
   rooms,
   loading,
   onCardClick,
   onDayCurveClick,
   onWeekCurveClick,
   onAddPersonnel,
   onViewDetails,
}) => {
   // 🔥 跟踪"曲线"tab的加载状态
   const [isCurveTabLoading, setIsCurveTabLoading] = useState(false);
   const curveViewMountedRef = useRef(false);
   const prevActiveTabRef = useRef<string>(activeTab);

   // 🔥 包装onTabChange，在调用之前立即设置loading状态
   const handleTabChange = (key: string) => {
      // 如果切换到"曲线"tab，立即显示loading（在onTabChange调用之前）
      if (key === "curve" && activeTab !== "curve") {
         setIsCurveTabLoading(true);
         curveViewMountedRef.current = false;
      } else if (key !== "curve") {
         // 切换到其他tab，立即重置状态
         setIsCurveTabLoading(false);
         curveViewMountedRef.current = false;
      }
      // 调用原始的onTabChange
      onTabChange(key);
   };

   // 🔥 检测tab切换，当切换到"曲线"tab时显示loading（作为备用，确保状态同步）
   useEffect(() => {
      if (activeTab === "curve" && prevActiveTabRef.current !== "curve") {
         // 切换到曲线tab（如果handleTabChange没有触发，这里作为备用）
         if (!isCurveTabLoading) {
            setIsCurveTabLoading(true);
         }
         curveViewMountedRef.current = false;
      } else if (activeTab !== "curve") {
         // 切换到其他tab，重置状态
         setIsCurveTabLoading(false);
         curveViewMountedRef.current = false;
      }
      prevActiveTabRef.current = activeTab;
   }, [activeTab, isCurveTabLoading]);

   // 🔥 当CurveView组件挂载完成后，隐藏loading
   useEffect(() => {
      if (activeTab === "curve" && !curveViewMountedRef.current) {
         // 使用requestAnimationFrame确保在下一帧执行，此时组件应该已经渲染
         const timer = requestAnimationFrame(() => {
            setTimeout(() => {
               setIsCurveTabLoading(false);
               curveViewMountedRef.current = true;
            }, 100); // 给一点时间确保组件完全渲染
         });
         return () => cancelAnimationFrame(timer);
      }
   }, [activeTab]);

   // 🔥 使用 useMemo 稳定 tabItems，但确保依赖项包含实际数据变化
   // 🔥 关键修复：生成一个基于数据内容的key，确保数据更新时重新渲染
   const dataContentKey = useMemo(() => {
      // 基于所有人员的关键数据生成一个key，包含所有实时更新的字段
      return allRoomPersonnel
         .map((rp) => {
            if (!rp.personnel || !rp.deviceInfo) return "";
            const di = rp.deviceInfo;
            // 使用关键字段生成key，包括所有实时更新的字段
            return `${rp.personnel.id}:${di.heartRate}:${di.breathRate}:${di.distance}:${di.braceletHeartRate}:${di.spo2}:${di.systolicPressure}:${di.diastolicPressure}:${di.bodyTemperature}:${di.reflection}:${di.pnn50}:${di.lfHfRatio}:${di.stressEmotion}:${di.fatigueTolerance}:${di.heartAttackRisk}:${di.sleepQuality}`;
         })
         .join("|");
   }, [allRoomPersonnel]);

   const tabItems = useMemo(
      () => [
         {
            key: "card",
            label: "卡片",
            children: (
               <CardView
                  allRoomPersonnel={allRoomPersonnel}
                  showPersonnelName={showPersonnelName}
                  alarms={alarms}
                  associations={associations}
                  roomTypes={roomTypes}
                  roomTemplates={roomTemplates}
                  rooms={rooms}
                  loading={loading}
                  onCardClick={onCardClick}
                  onDayCurveClick={onDayCurveClick}
                  onWeekCurveClick={onWeekCurveClick}
                  onAddPersonnel={onAddPersonnel}
                  onViewDetails={onViewDetails}
               />
            ),
         },
         {
            key: "curve",
            label: (
               <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {isCurveTabLoading && <Spin size='small' style={{ marginRight: 4 }} />}
                  曲线
               </span>
            ),
            children: <CurveView onCardClick={onCardClick} onAddPersonnel={onAddPersonnel} />,
         },
         {
            key: "report",
            label: "报表",
            children: (
               <ReportView
                  allRoomPersonnel={allRoomPersonnel}
                  showPersonnelName={showPersonnelName}
                  alarms={alarms}
                  associations={associations}
                  roomTypes={roomTypes}
                  roomTemplates={roomTemplates}
                  rooms={rooms}
                  loading={loading}
                  onCardClick={onCardClick}
                  onDayCurveClick={onDayCurveClick}
                  onWeekCurveClick={onWeekCurveClick}
                  onAddPersonnel={onAddPersonnel}
                  onViewDetails={onViewDetails}
               />
            ),
         },
         {
            key: "alarm",
            label: "报警",
            children: <AlarmView alarms={alarms} rooms={rooms} loading={loading} />,
         },
      ],
      [
         // 🔥 关键修复：使用数据内容key，确保数据更新时重新渲染
         dataContentKey,
         showPersonnelName,
         alarms.length,
         associations.length,
         roomTypes.length,
         roomTemplates.length,
         rooms.length,
         loading,
         // 🔥 添加曲线tab的loading状态，确保label更新
         isCurveTabLoading,
         // 🔥 回调函数应该是稳定的（使用 useCallback），但为了安全起见，仍然作为依赖项
         onCardClick,
         onDayCurveClick,
         onWeekCurveClick,
         onAddPersonnel,
         onViewDetails,
      ]
   );

   return <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} />;
};

export default React.memo(TabView);
