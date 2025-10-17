// types.ts

export interface AlertConfig {
   config_name: string;
   value: string | number | boolean;
}

export interface SmsConfig {
   smsEnabled: boolean;
   smsBaudRate: number;
   smsPort: string;
   smsVerificationCodeExpiry: number;
   smsParity: string;
   smsDataBits: number;
   smsStopBits: number;
}

export const defaultSmsConfig: SmsConfig = {
   smsEnabled: true,
   smsVerificationCodeExpiry: 120,
   smsPort: "USB1",
   smsBaudRate: 9600,
   smsParity: "None",
   smsDataBits: 8,
   smsStopBits: 1,
};

export interface Radar {
   id: string | number;
   person_pose: string;
   distance: number;
   remark?: string;
   ip?: string;
}

export interface RoomConfig {
   id: number;
   name: string;
   type: number;
   radars: RadarConfig[];
   maxPersonnel: number;
   remark?: string;
}

export interface RadarConfig {
   id: string;
   ip: string;
   port: number;
   personPose: "坐姿" | "卧姿";
   distance: number;
}

export interface RoomState {
   id: number;
   personnel: PersonnelState[];
   radars: RadarState[];
}

export interface PersonnelState {
   id: number;
   name: string;
   status: "unarmed" | "armed";
   devices: {
      bracelet?: BraceletData;
      radars: RadarData[];
   };
   aggregatedData: AggregatedData;
   lastUpdate: number;
}

export interface BraceletData {
   id: string;
   heartRate: number;
   breathRate: number;
   batteryLevel: number;
   systolicPressure?: number;
   diastolicPressure?: number;
   bloodOxygen?: number;
   bodyTemperature?: number;
   lastUpdate: number;
}

export interface RadarData {
   id: string;
   heartRate: number;
   breathRate: number;
   posture: "坐姿" | "卧姿";
   distance: number;
   environmentInterference: number;
   lastUpdate: number;
}

export interface RadarState {
   id: string;
   status: "normal" | "failure" | "abnormal";
   connected: boolean;
}

export interface AggregatedData {
   heartRate: number;
   breathRate: number;
   posture: "坐姿" | "卧姿";
   distance: number;
}

export interface Room {
   id: number;
   name: string;
   enabled: boolean;
   personnel_id: number;
   typeId: number;
   type?: number;
   radars: {
      id: string | number;
      person_pose: string;
      distance: number;
   }[];
   remark?: string;
   networkFailure?: boolean;
   radarFailure?: boolean;
   radarAbnormal?: boolean;
   environment?: number;
   heartRate?: number;
   breathRate?: number;
   distance?: number;
   time?: string;
   person_pose?: string;
   mattress_distance?: number;
   personnelName?: string;
   schedules?: PersonnelSchedule[];
   state?: {
      personnel: PersonnelState[];
      radars: RadarState[];
   };
   config?: {
      maxPersonnel: number;
      maxRadars: number;
      remark?: string;
   };
   devices?: {
      radars: any[];
      bracelets: any[];
   };
   alarm?: boolean;
   templateType?: TemplateType;
   ip?: string;
   radar_id?: number;
}

export interface User {
   id: number;
   name: string;
   account: string;
   gender: string | null;
   age: number | null;
   password?: string;
   role: "user" | "admin";
   room_id: number | null; // Allow null for admin users
   remark: string;
}

export interface PersonnelSchedule {
   id?: number; // Optional for new schedules
   start_time: string;
   end_time: string;
   days_of_week: string;
}

export interface Personnel {
   id: number;
   name: string;
   id_number: string;
   room_id?: number | null; // Optional, can be null
   occupation?: string;
   age?: number;
   heart_rate_upper?: number;
   heart_rate_lower?: number;
   breath_upper?: number;
   breath_lower?: number;
   distance?: number;
   medical_history?: string;
   remark?: string;
   schedules?: PersonnelSchedule[]; // Array of schedules
   gender?: string; // Optional, as it might not be required for all personnel
   is_out?: boolean | string; // Optional
}

export const MEDICAL_HISTORIES = [
   { value: "d0", label: "---无---" },
   { value: "d1", label: "窦性心动过速" },
   { value: "d2", label: "心房颤动" },
   { value: "d3", label: "阵发性室上性心动过速（PSVT）" },
   { value: "d4", label: "窦性心动过缓" },
   { value: "d5", label: "病态窦房结综合征" },
   { value: "d6", label: "早搏（期外收缩）" },
   { value: "d7", label: "心室颤动" },
];

export interface OpenIdItem {
   key: number;
   openid: string;
   name: string;
}

export interface MiniConfig {
   wechatEnabled: boolean;
   wechatOpenIdList: OpenIdItem[];
}

export const defaultMiniConfig: MiniConfig = {
   wechatEnabled: false,
   wechatOpenIdList: [],
};

export interface DataPoint {
   date: string;
   value: number;
   type?: string; // Optional type for series differentiation
}

export interface HistoricalData {
   id: number; // Assuming your API returns an ID for each historical data point
   time: string; // Assuming the backend returns time in ISO 8601 format
   room_id: number;
   personnel_id: number;
   breath_rate: number;
   breath_rate_max: number;
   breath_rate_min: number;
   heart_rate: number;
   heart_rate_max: number;
   heart_rate_min: number;
   u60heart_rate: number;
   u60heart_rate_max: number;
   u60heart_rate_min: number;
   target_distance: number;
   target_distance_max: number;
   target_distance_min: number;
   environment: number;
   create_date: string; // Assuming ISO 8601 format
   update_date: string; // Assuming ISO 8601 format
}

export interface RoomAuthConfig {
   roomAuthEnabled: boolean;
}

export const defaultRoomAuthConfig: RoomAuthConfig = {
   roomAuthEnabled: false,
};

export enum TemplateType {
   SINGLE_RADAR_SINGLE_BRACELET = "SINGLE_RADAR_SINGLE_BRACELET",
   SINGLE_RADAR_MULTI_BRACELET = "SINGLE_RADAR_MULTI_BRACELET",
   MULTI_RADAR_MULTI_BRACELET = "MULTI_RADAR_MULTI_BRACELET",
   VEHICLE_MODE = "VEHICLE_MODE",
}

export interface RoomType {
   typeId: number;
   typeName: string;
   templateId: number;
   remark?: string;
}

export interface RoomTemplate {
   templateId: number;
   templateName: string;
   maxRadars: number;
   maxPersonnel: number;
   remark?: string;
}

export interface WebSocketMessage {
   type: "braceletUpdate" | "radarUpdate";
   roomId: number;
   personnelId: number;
   data: BraceletData | RadarData;
}
