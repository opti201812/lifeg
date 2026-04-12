import { useMemo, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";
import { getAllRoomPersonnel, processPersonnelDeviceData } from "../utils/dataProcessors";
import { getBraceletStatusText } from "../../../utils/braceletStatus";

export const usePersonnelData = (roomId?: string) => {
   const rooms = useSelector((state: RootState) => state.data.rooms);
   const personnel = useSelector((state: RootState) => state.data.personnel);
   const associations = useSelector((state: RootState) => state.data.associations);
   const radars = useSelector((state: RootState) => state.data.radars);
   const personDeviceData = useSelector((state: RootState) => state.data.personDeviceData);
   const alarms = useSelector((state: RootState) => state.data.alarms);
   const roomTemplates = useSelector((state: RootState) => state.data.roomTemplates);
   const roomTypes = useSelector((state: RootState) => state.data.roomTypes);

   // 使用ref缓存上一次的计算结果，避免不必要的重计算
   const lastResultRef = useRef<{
      allRoomPersonnel: any[];
      personDeviceData: any;
      radars: any[];
      result: any[];
      roomId?: string;
   } | null>(null);

   // 浅比较函数，检查关键数据是否变化
   const hasDataChanged = useCallback((current: any, previous: any) => {
      if (!previous) return true;

      // 🔥 关键修复：检查 roomId 是否变化（切换房间时必须重新计算）
      if (current.roomId !== previous.roomId) {
         return true;
      }

      // 🔥 关键修复：检查 allRoomPersonnel 引用是否变化
      // 当 roomId 变化时，allRoomPersonnel 会返回不同房间的数据，引用会改变
      if (current.allRoomPersonnel !== previous.allRoomPersonnel) {
         return true;
      }

      // 检查 radars 数组长度是否变化
      if (current.radars.length !== previous.radars.length) {
         return true;
      }

      // 检查personDeviceData是否有新的更新
      const currentKeys = Object.keys(current.personDeviceData);
      const previousKeys = Object.keys(previous.personDeviceData);

      if (currentKeys.length !== previousKeys.length) return true;

      // 检查是否有新的或更新的数据
      for (const key of currentKeys) {
         const currentData = current.personDeviceData[key];
         const previousData = previous.personDeviceData[key];

         if (!previousData) return true;

         // 检查关键字段是否变化（只比较最新值，避免深度比较）
         if (currentData?.timestamp !== previousData?.timestamp) {
            return true;
         }
      }

      return false;
   }, []);

   const allRoomPersonnel = useMemo(() => {
      return getAllRoomPersonnel(rooms, associations, personnel, roomTypes, roomTemplates, roomId);
   }, [rooms, associations, personnel, roomTypes, roomTemplates, roomId]);

   const processedPersonnelData = useMemo(() => {
      const currentData = { allRoomPersonnel, personDeviceData, radars, roomId };

      // 🔥 优化：使用缓存避免不必要的重计算
      if (!hasDataChanged(currentData, lastResultRef.current)) {
         console.debug("[usePersonnelData] 使用缓存结果，避免重计算", {
            roomId,
            allRoomPersonnelLength: allRoomPersonnel.length,
            cachedLength: lastResultRef.current?.result?.length || 0,
         });
         return lastResultRef.current!.result;
      }

      const now = Date.now();

      const result = allRoomPersonnel.map((roomPersonnel) => {
         if (!roomPersonnel.personnel) {
            return roomPersonnel;
         }

         const deviceInfo = processPersonnelDeviceData(roomPersonnel.personnel.id, personDeviceData, radars, now);

         const tamperStatus = deviceInfo.braceletData ? deviceInfo.braceletData.tamperStatus : null;
         const braceletStatus = getBraceletStatusText(
            {
               heartRate: deviceInfo.heartRate,
               environmentInterference: deviceInfo.environmentInterference,
               breathRate: deviceInfo.breathRate,
            },
            tamperStatus,
         );

         return {
            ...roomPersonnel,
            deviceInfo,
            braceletStatus,
         };
      });

      // 更新缓存
      lastResultRef.current = {
         ...currentData,
         result,
      };

      return result;
   }, [allRoomPersonnel, personDeviceData, radars, hasDataChanged]);

   return {
      allRoomPersonnel: processedPersonnelData,
      rawData: {
         rooms,
         personnel,
         associations,
         radars,
         personDeviceData,
         alarms,
         roomTemplates,
         roomTypes,
      },
   };
};
