import { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";
import { getAllRoomPersonnel, processPersonnelDeviceData } from "../utils/dataProcessors";
import { getBraceletStatusText } from "../../../utils/braceletStatus";

/**
 * 人员数据处理hook
 */
export const usePersonnelData = (roomId?: string) => {
   // 从Redux获取数据
   const rooms = useSelector((state: RootState) => state.data.rooms);
   const personnel = useSelector((state: RootState) => state.data.personnel);
   const associations = useSelector((state: RootState) => state.data.associations);
   const radars = useSelector((state: RootState) => state.data.radars);
   const personDeviceData = useSelector((state: RootState) => state.data.personDeviceData);
   const alarms = useSelector((state: RootState) => state.data.alarms);
   const roomTemplates = useSelector((state: RootState) => state.data.roomTemplates);
   const roomTypes = useSelector((state: RootState) => state.data.roomTypes);

   // 获取所有房间人员数据
   const allRoomPersonnel = useMemo(() => {
      return getAllRoomPersonnel(rooms, associations, personnel, roomTypes, roomTemplates, roomId);
   }, [rooms, associations, personnel, roomTypes, roomTemplates, roomId]);

   // 处理人员设备数据和状态
   const processedPersonnelData = useMemo(() => {
      const now = Date.now();

      return allRoomPersonnel.map((roomPersonnel) => {
         if (!roomPersonnel.personnel) {
            return roomPersonnel;
         }

         const deviceInfo = processPersonnelDeviceData(roomPersonnel.personnel.id, personDeviceData, radars, now);

         // 手环状态
         const tamperStatus = deviceInfo.braceletData ? deviceInfo.braceletData.tamperStatus : null;
         const braceletStatus = getBraceletStatusText(
            {
               heartRate: deviceInfo.heartRate,
               environmentInterference: deviceInfo.environmentInterference,
               breathRate: deviceInfo.breathRate,
            },
            tamperStatus
         );

         return {
            ...roomPersonnel,
            deviceInfo,
            braceletStatus,
         };
      });
   }, [allRoomPersonnel, personDeviceData, radars]);

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
