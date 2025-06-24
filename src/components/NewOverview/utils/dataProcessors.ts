import { Room, Association, Personnel, RoomPersonnel } from "../types";
import { RADAR_DATA_EXPIRE_TIME } from "./constants";

/**
 * 获取房间最大人员数
 */
export const getRoomMaxPersonnel = (room: Room, roomTypes: any[], roomTemplates: any[]): number => {
   // 创建roomType和template的映射，提高查询性能
   const roomTypeMap = new Map();
   roomTypes.forEach((roomType) => {
      roomTypeMap.set(roomType.typeId, roomType);
   });

   const templateMap = new Map();
   roomTemplates.forEach((template) => {
      templateMap.set(template.templateId, template);
   });

   const roomType = roomTypeMap.get(room.typeId);
   if (!roomType) return 1; // 默认最大1人

   const template = templateMap.get(roomType.templateId);
   return template?.maxPersonnel || 1;
};

/**
 * 获取所有房间人员数据（重构：直接遍历associations）
 */
export const getAllRoomPersonnel = (
   rooms: Room[],
   associations: Association[],
   personnel: Personnel[],
   roomTypes: any[],
   roomTemplates: any[],
   roomId?: string
): (RoomPersonnel & { sortType: number })[] => {
   // 创建房间ID到关联人员数量的映射
   const roomPersonnelCountMap = new Map<number, number>();
   associations.forEach((a) => {
      if (a.roomId) {
         const count = roomPersonnelCountMap.get(a.roomId) || 0;
         roomPersonnelCountMap.set(a.roomId, count + 1);
      }
   });

   // 1. 已关联房间和人员的数据
   const roomPersonnelPairs = associations
      .filter((a) => a.roomId && a.roomId !== -1 && (!roomId || String(a.roomId) === String(roomId)))
      .map((a) => {
         const room = rooms.find((r) => String(r.id) === String(a.roomId));
         const personnelData = personnel.find((p) => String(p.id) === String(a.personnelId));
         return {
            room: room || { id: -1, name: "未知房间", typeId: 0, enabled: false },
            personnel: personnelData || null,
            associationId: String(a.id || a.associationId || ""),
            sortType: 1, // 类型1：已关联房间和人员
         };
      })
      .filter((item) => item.room.id !== -1) as (RoomPersonnel & { sortType: number })[];

   // 2. 已关联人员、未关联房间的数据（待分配房间）
   const unassignedPersonnel = associations
      .filter((a) => !a.roomId || a.roomId === -1)
      .map((a) => {
         const personnelData = personnel.find((p) => String(p.id) === String(a.personnelId));
         return {
            room: { id: -1, name: "待分配房间", typeId: 0, enabled: false },
            personnel: personnelData || null,
            associationId: String(a.id || a.associationId || ""),
            sortType: 2, // 类型2：已关联人员、未关联房间
         };
      }) as (RoomPersonnel & { sortType: number })[];

   // 3. 包含空余位置的房间（可设防房间）
   const availableRooms = rooms
      .filter((room) => {
         const currentCount = roomPersonnelCountMap.get(room.id) || 0;
         const maxPersonnel = getRoomMaxPersonnel(room, roomTypes, roomTemplates);

         return currentCount < maxPersonnel && (!roomId || String(room.id) === String(roomId));
      })
      .map((room) => ({
         room: {
            ...room,
            maxPersonnel: getRoomMaxPersonnel(room, roomTypes, roomTemplates),
         },
         personnel: null,
         associationId: "",
         sortType: 3, // 类型3：包含空余位置的房间
      })) as (RoomPersonnel & { sortType: number })[];

   // 合并所有数据并按sortType排序
   const allData = [...roomPersonnelPairs, ...unassignedPersonnel, ...availableRooms];

   return allData.sort((a, b) => {
      // 首先按sortType排序（1 < 2 < 3）
      if (a.sortType !== b.sortType) {
         return a.sortType - b.sortType;
      }

      // 同类型内部按房间ID排序
      if (a.room.id === -1 && b.room.id !== -1) return 1;
      if (a.room.id !== -1 && b.room.id === -1) return -1;
      return a.room.id - b.room.id;
   });
};

/**
 * 处理人员设备数据
 */
export const processPersonnelDeviceData = (
   personnelId: number,
   personDeviceData: any,
   radars: any[],
   now: number = Date.now()
) => {
   // 获取人员设备数据
   const deviceData = personDeviceData[personnelId];

   // 选择手环数据
   const braceletData = deviceData?.devices?.bracelet;

   // 选择环境值较大的雷达数据
   let selectedRadarData: any = null;
   let roomAndRadarData = {};
   let radarData = null;

   if (deviceData?.devices?.radar) {
      radarData = deviceData.devices.radar;
      const filteredRadarData = radarData.filter((r: any) => r.environmentInterference > 0);

      if (filteredRadarData.length > 0) {
         selectedRadarData = filteredRadarData.reduce((prev: any, current: any) =>
            prev.environmentInterference > current.environmentInterference ? prev : current
         );
         const selectedRadar = radars.find((r: any) => String(r.id) == String(selectedRadarData.deviceId));
         roomAndRadarData = {
            mattress_distance: selectedRadar?.distance,
            distance: selectedRadarData.distance,
            person_pose: selectedRadar?.person_pose,
         };
      }
   }

   // 修改过期判断逻辑，直接使用当前时间now
   const isRadarDataExpired = selectedRadarData ? now - selectedRadarData.timestamp > RADAR_DATA_EXPIRE_TIME : true;
   const heartRate = braceletData
      ? braceletData.heartRate
      : selectedRadarData && !isRadarDataExpired
      ? selectedRadarData.heartRate
      : "-";
   const breathRate = selectedRadarData && !isRadarDataExpired ? selectedRadarData.breathRate : "-";
   const distance = selectedRadarData && !isRadarDataExpired ? selectedRadarData.distance : "-";
   const environmentInterference =
      selectedRadarData && !isRadarDataExpired ? selectedRadarData.environmentInterference : "-";

   return {
      braceletData,
      selectedRadarData,
      roomAndRadarData,
      heartRate,
      breathRate,
      distance,
      environmentInterference,
      isRadarDataExpired,
   };
};
