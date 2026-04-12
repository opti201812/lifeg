import { useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../../../store";
import { getAllRoomPersonnel, processPersonnelDeviceData } from "../../../utils/dataProcessors";
import { getBraceletStatusText } from "../../../../../utils/braceletStatus";

/**
 * 人员数据聚合和处理 Hook
 */
export const usePersonnelData = (roomId?: string) => {
   // 从 Redux 获取所有需要的数据
   const rooms = useSelector((state: RootState) => state.data.rooms);
   const personnel = useSelector((state: RootState) => state.data.personnel);
   const associations = useSelector((state: RootState) => state.data.associations);
   const radars = useSelector((state: RootState) => state.data.radars);
   const personDeviceData = useSelector((state: RootState) => state.data.personDeviceData);
   const roomTemplates = useSelector((state: RootState) => state.data.roomTemplates);
   const roomTypes = useSelector((state: RootState) => state.data.roomTypes);

   // 优化：使用缓存机制，只在真正需要时重新计算
   const lastAllRoomPersonnelRef = useRef<{
      basePersonnel: any[];
      personDeviceDataKeys: string;
      radarsLength: number;
      result: any[];
   } | null>(null);

   // 计算 allRoomPersonnel（使用 useMemo 稳定引用）
   const allRoomPersonnel = useMemo(() => {
      const basePersonnel = getAllRoomPersonnel(rooms, associations, personnel, roomTypes, roomTemplates, roomId);
      const personDeviceDataKeys = Object.keys(personDeviceData).join(",");

      // 检查是否需要重新计算
      if (lastAllRoomPersonnelRef.current) {
         const cached = lastAllRoomPersonnelRef.current;
         // 如果基础数据没变，且 personDeviceData 的 key 没变，且 radars 长度没变，使用缓存
         if (
            cached.basePersonnel.length === basePersonnel.length &&
            cached.personDeviceDataKeys === personDeviceDataKeys &&
            cached.radarsLength === radars.length
         ) {
            // 只更新设备数据，而不是重新创建整个数组
            const now = Date.now();
            return cached.result.map((roomPersonnel) => {
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
         }
      }

      // 需要重新计算
      const now = Date.now();
      const result = basePersonnel.map((roomPersonnel) => {
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
      lastAllRoomPersonnelRef.current = {
         basePersonnel,
         personDeviceDataKeys,
         radarsLength: radars.length,
         result,
      };

      return result;
   }, [rooms, associations, personnel, roomTypes, roomTemplates, roomId, personDeviceData, radars]);

   return {
      allRoomPersonnel,
   };
};
