import { Room, Association, Personnel, RoomPersonnel } from "../types";
import { RADAR_DATA_EXPIRE_TIME, BRACELET_HOLD_TIME } from "../utils/constants";

// ========== 手环字段级缓存（数据保持机制） ==========

interface BraceletFieldEntry {
   value: number | string;
   lastUpdateTime: number;
}

interface BraceletFieldCache {
   braceletHeartRate: BraceletFieldEntry;
   systolicPressure: BraceletFieldEntry;
   diastolicPressure: BraceletFieldEntry;
   spo2: BraceletFieldEntry;
   bodyTemperature: BraceletFieldEntry;
}

const braceletFieldCacheMap = new Map<number, BraceletFieldCache>();

function getOrCreateBraceletCache(personId: number): BraceletFieldCache {
   if (!braceletFieldCacheMap.has(personId)) {
      braceletFieldCacheMap.set(personId, {
         braceletHeartRate: { value: "-", lastUpdateTime: 0 },
         systolicPressure: { value: "-", lastUpdateTime: 0 },
         diastolicPressure: { value: "-", lastUpdateTime: 0 },
         spo2: { value: "-", lastUpdateTime: 0 },
         bodyTemperature: { value: "-", lastUpdateTime: 0 },
      });
   }
   return braceletFieldCacheMap.get(personId)!;
}

/**
 * 解析手环字段值，带缓存保持逻辑：
 * - 当前数据包该字段有有效值 → 更新缓存并返回
 * - 当前数据包该字段缺失   → 检查缓存是否在 BRACELET_HOLD_TIME 内，是则返回缓存值，否则返回 "-"
 * 每个字段独立计时，互不影响。
 */
function resolveBraceletField(
   cache: BraceletFieldCache,
   field: keyof BraceletFieldCache,
   rawValue: any,
   now: number
): number | string {
   if (rawValue != null && rawValue !== "-") {
      cache[field].value = rawValue;
      cache[field].lastUpdateTime = now;
      return rawValue;
   }
   if (now - cache[field].lastUpdateTime < BRACELET_HOLD_TIME) {
      return cache[field].value;
   }
   return "-";
}

export const getRoomMaxPersonnel = (room: Room, roomTypes: any[], roomTemplates: any[]): number => {
   // 防御性检查：确保 roomTypes 和 roomTemplates 是数组
   const safeRoomTypes = Array.isArray(roomTypes) ? roomTypes : [];
   const safeRoomTemplates = Array.isArray(roomTemplates) ? roomTemplates : [];

   const roomTypeMap = new Map();
   safeRoomTypes.forEach((roomType) => {
      roomTypeMap.set(roomType.typeId, roomType);
   });

   const templateMap = new Map();
   safeRoomTemplates.forEach((template) => {
      templateMap.set(template.templateId, template);
   });

   const roomType = roomTypeMap.get(room.typeId);
   if (!roomType) return 1;

   const template = templateMap.get(roomType.templateId);
   return template?.maxPersonnel || 1;
};

export const getAllRoomPersonnel = (
   rooms: Room[],
   associations: Association[],
   personnel: Personnel[],
   roomTypes: any[],
   roomTemplates: any[],
   roomId?: string
): (RoomPersonnel & { sortType: number })[] => {
   // 防御性检查：确保所有数组参数都是数组
   const safeRooms = Array.isArray(rooms) ? rooms : [];
   const safeAssociations = Array.isArray(associations) ? associations : [];
   const safePersonnel = Array.isArray(personnel) ? personnel : [];
   const safeRoomTypes = Array.isArray(roomTypes) ? roomTypes : [];
   const safeRoomTemplates = Array.isArray(roomTemplates) ? roomTemplates : [];

   const roomPersonnelCountMap = new Map<number, number>();
   safeAssociations.forEach((a) => {
      if (a.roomId) {
         const count = roomPersonnelCountMap.get(a.roomId) || 0;
         roomPersonnelCountMap.set(a.roomId, count + 1);
      }
   });

   const roomPersonnelPairs = safeAssociations
      .filter((a) => a.roomId && a.roomId !== -1 && (!roomId || String(a.roomId) === String(roomId)))
      .map((a) => {
         const room = safeRooms.find((r) => String(r.id) === String(a.roomId));
         const personnelData = safePersonnel.find((p) => String(p.id) === String(a.personnelId));
         return {
            room: room || { id: -1, name: "未知房间", typeId: 0, enabled: false },
            personnel: personnelData || null,
            associationId: String(a.id || a.associationId || ""),
            sortType: 1,
         };
      })
      .filter((item) => item.room.id !== -1) as (RoomPersonnel & { sortType: number })[];

   const unassignedPersonnel = safeAssociations
      .filter((a) => !a.roomId || a.roomId === -1)
      .map((a) => {
         const personnelData = safePersonnel.find((p) => String(p.id) === String(a.personnelId));
         return {
            room: { id: -1, name: "待分配房间", typeId: 0, enabled: false },
            personnel: personnelData || null,
            associationId: String(a.id || a.associationId || ""),
            sortType: 2,
         };
      }) as (RoomPersonnel & { sortType: number })[];

   const availableRooms = safeRooms
      .filter((room) => {
         const currentCount = roomPersonnelCountMap.get(room.id) || 0;
         const maxPersonnel = getRoomMaxPersonnel(room, safeRoomTypes, safeRoomTemplates);

         return currentCount < maxPersonnel && (!roomId || String(room.id) === String(roomId));
      })
      .map((room) => ({
         room: {
            ...room,
            maxPersonnel: getRoomMaxPersonnel(room, safeRoomTypes, safeRoomTemplates),
         },
         personnel: null,
         associationId: "",
         sortType: 3,
      })) as (RoomPersonnel & { sortType: number })[];

   const allData = [...roomPersonnelPairs, ...unassignedPersonnel, ...availableRooms];

   return allData.sort((a, b) => {
      if (a.sortType !== b.sortType) {
         return a.sortType - b.sortType;
      }
      if (a.room.id === -1 && b.room.id !== -1) return 1;
      if (a.room.id !== -1 && b.room.id === -1) return -1;
      return a.room.id - b.room.id;
   });
};

export const processPersonnelDeviceData = (
   personnelId: number,
   personDeviceData: any,
   radars: any[],
   now: number = Date.now()
) => {
   const deviceData = personDeviceData[personnelId];
   const braceletData = deviceData?.devices?.bracelet;

   let selectedRadarData: any = null;
   let roomAndRadarData = {} as any;
   let radarData = null as any;

   // 🔥 手环字段级缓存初始化
   const braceletCache = getOrCreateBraceletCache(personnelId);

   if (deviceData?.devices?.radar) {
      // 处理雷达数据可能是数组或单个对象的情况
      radarData = Array.isArray(deviceData.devices.radar)
         ? deviceData.devices.radar
         : [deviceData.devices.radar];
      // environmentInterference=环境干扰（越低越好；0=无干扰为最佳合法值，后端仅丢弃 >12 的数据），故 0 不可过滤
      const filteredRadarData = radarData.filter(
         (r: any) => r.environmentInterference != null && r.environmentInterference >= 0
      );

      if (filteredRadarData.length > 0) {
         // 多雷达时选择环境干扰最小者（信号最佳）
         selectedRadarData = filteredRadarData.reduce((prev: any, current: any) =>
            prev.environmentInterference < current.environmentInterference ? prev : current
         );
         const selectedRadar = radars.find((r: any) => String(r.id) == String(selectedRadarData.deviceId));
         roomAndRadarData = {
            mattress_distance: selectedRadar?.distance,
            distance: selectedRadarData.distance,
            person_pose: selectedRadar?.person_pose,
         };
      }
   }

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

   // 🔥 扩充数据字段：信噪比（反射强度）
   const reflection = selectedRadarData && !isRadarDataExpired ? selectedRadarData.reflection : "-";
   
   // 🔥 手环数据（带字段级缓存保持）
   const braceletHeartRate = resolveBraceletField(braceletCache, "braceletHeartRate", braceletData?.heartRate, now);
   const systolicPressure = resolveBraceletField(braceletCache, "systolicPressure", braceletData?.systolicPressure, now);
   const diastolicPressure = resolveBraceletField(braceletCache, "diastolicPressure", braceletData?.diastolicPressure, now);
   const spo2 = resolveBraceletField(braceletCache, "spo2", braceletData?.spo2 || braceletData?.bloodOxygen, now);
   const bodyTemperature = resolveBraceletField(braceletCache, "bodyTemperature", braceletData?.bodyTemperature, now);
   
   // 🔥 血氧仪数据
   const oximeterData = deviceData?.devices?.oximeter;
   const oximeterHeartRate = oximeterData?.heartRate || "-";
   
   // 🔥 心率变异性指标
   const pnn50 = selectedRadarData && !isRadarDataExpired ? selectedRadarData.pnn50 : "-";
   const lfHfRatio = selectedRadarData && !isRadarDataExpired ? selectedRadarData.lfHfRatio : "-";
   
   // 🔥 综合评测指标
   const stressEmotion = selectedRadarData && !isRadarDataExpired ? selectedRadarData.stressEmotion : "-";
   const fatigueTolerance = selectedRadarData && !isRadarDataExpired ? selectedRadarData.fatigueTolerance : "-";
   const heartAttackRisk = selectedRadarData && !isRadarDataExpired ? selectedRadarData.heartAttackRisk : "-";
   const sleepQuality = selectedRadarData && !isRadarDataExpired ? selectedRadarData.sleepQuality : "-";

   return {
      braceletData,
      selectedRadarData,
      roomAndRadarData,
      heartRate,
      breathRate,
      distance,
      environmentInterference,
      isRadarDataExpired,
      // 🔥 新增字段
      reflection,
      braceletHeartRate,
      systolicPressure,
      diastolicPressure,
      spo2,
      bodyTemperature,
      oximeterHeartRate,
      pnn50,
      lfHfRatio,
      stressEmotion,
      fatigueTolerance,
      heartAttackRisk,
      sleepQuality,
   };
};
