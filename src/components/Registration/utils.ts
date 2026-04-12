import {
   RegistrationRecord,
   PersonnelData,
   AssociationData,
   BraceletResponse,
   OximeterResponse,
   OximeterConfigResponse,
   BraceletDevice,
   OximeterDevice,
} from "./types";

// 数据规范化工具函数
export const normalizeArray = (payload: any): any[] => {
   if (Array.isArray(payload)) return payload;
   if (Array.isArray(payload?.data)) return payload.data;
   return [];
};

// 将人员和关联数据转换为表格记录
export const buildRegistrationRecords = (
   personnelList: PersonnelData[],
   associations: AssociationData[]
): RegistrationRecord[] => {
   return personnelList.map((person) => {
      const assoc = associations.find((item) => String(item.personnelId) === String(person.id));
      const hasAssociation = Boolean(assoc);

      return {
         id: String(person.id),
         personnelId: Number(person.id),
         associationId: assoc?.id,
         name: person.name,
         idNumber: person.id_number,
         gender: person.gender,
         age: Number(person.age) || 0,
         braceletId: assoc?.braceletId,
         oximeterId: assoc?.oximeterId,
         oximeterEnabled: !!assoc?.oximeterId,
         heartRate: assoc?.heartRate,
         breathRate: assoc?.breathRate,
         restingHeartRate: assoc?.restingHeartRate,
         restingBreathRate: assoc?.restingBreathRate,
         medicalHistory: Array.isArray(person.medical_history) ? person.medical_history : [],
         remarks: person.remark,
         registrationTime: person.lastUpdate ? new Date(person.lastUpdate).toLocaleString() : "-",
         status: hasAssociation ? "completed" : "pending",
      };
   });
};

// 获取可用手环 ID（未分配的手环）
export const getAvailableBraceletIds = (braceletData: BraceletResponse, associations: AssociationData[]): string[] => {
   const assignedBraceletIds = new Set(
      associations.filter((assoc) => assoc.braceletId != null).map((assoc) => String(assoc.braceletId))
   );

   const onlineBracelets = braceletData.onlineBracelets || [];
   const offlineBracelets = braceletData.offlineBracelets || [];
   const allBracelets = [...onlineBracelets, ...offlineBracelets];

   return Array.from(
      new Set(
         allBracelets
            .map((bracelet) => bracelet.deviceId?.toString())
            .filter((id: string | undefined): id is string => !!id && !assignedBraceletIds.has(id))
      )
   );
};

// 构建人员 API payload
export const buildPersonnelPayload = (values: any) => ({
   name: values.name,
   id_number: values.idNumber,
   age: Number(values.age),
   gender: values.gender,
   medical_history: Array.isArray(values.medicalHistory) ? values.medicalHistory : [],
   remark: values.remarks || "",
   heart_rate: values.heartRate,
   breath_rate: values.breathRate,
   heart_rate_resting: values.restingHeartRate,
   breath_rate_resting: values.restingBreathRate,
});

// 构建关联 API payload
export const buildAssociationPayload = (values: any) => ({
   braceletId: values.braceletId || null,
   oximeterId: values.oximeterId || null,
   heartRate: Number(values.heartRate),
   breathRate: Number(values.breathRate),
   restingHeartRate: Number(values.restingHeartRate),
   restingBreathRate: Number(values.restingBreathRate),
});

/**
 * 从手环数据中提取心率并填充表单
 * 用于新增时或切换手环时自动填充表单
 */
export const fillFormFromBracelet = (braceletDevice: BraceletDevice | null) => {
   if (!braceletDevice) return null;

   const heartRate = braceletDevice.data?.heartRate || 0;
   // 静息心率 = 当前心率 - 20，最低 40
   const restingHeartRate = Math.max(40, heartRate - 20);

   return {
      heartRate,
      restingHeartRate,
   };
};

/**
 * 从血氧仪数据中提取所有生命体征并填充表单
 * 用于连接血氧仪时自动填充所有表单字段
 */
export const fillFormFromOximeter = (oximeterDevice: OximeterDevice | null) => {
   if (!oximeterDevice) return null;

   const { data } = oximeterDevice;
   const heartRate = data?.heartRate || 0;

   return {
      spo2: data?.spo2,
      heartRate,
      breathRate: data?.breathRate,
      bodyTemperature: data?.bodyTemperature,
      systolicPressure: data?.systolicPressure,
      diastolicPressure: data?.diastolicPressure,
      // 静息心率 = 当前心率 - 20，最低 40
      restingHeartRate: Math.max(40, heartRate - 20),
      restingBreathRate: data?.breathRate ? Math.max(8, data.breathRate - 4) : undefined,
   };
};

/**
 * 获取血氧仪设备 ID（从配置响应中提取）
 */
export const getAvailableOximeterIds = (oximeterData: OximeterConfigResponse): string[] => {
   if (oximeterData.success && oximeterData.data?.deviceId) {
      return [oximeterData.data.deviceId];
   }
   return [];
};

/**
 * 从手环/血氧仪列表中查找指定设备
 */
export const findBraceletDevice = (deviceId: string, braceletData: BraceletResponse): BraceletDevice | null => {
   const allBracelets = [...(braceletData.onlineBracelets || []), ...(braceletData.offlineBracelets || [])];
   return allBracelets.find((b) => String(b.deviceId) === String(deviceId)) || null;
};

export const findOximeterDevice = (deviceId: string, oximeterData: OximeterConfigResponse): OximeterDevice | null => {
   if (oximeterData.success && oximeterData.data?.deviceId === deviceId) {
      return {
         deviceId: oximeterData.data.deviceId,
         isOnline: true,
         isConfigured: true,
         lastUpdateTime: 0,
         lastUpdateTimeISO: "",
         offlineMinutes: 0,
         data: {
            spo2: 0,
            heartRate: 0,
         },
      };
   }
   return null;
};
