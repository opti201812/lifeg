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
   id: number;
   name: string;
   url: string;
   enabled: boolean;
   remark: string;
}

export interface Room {
   id: number;
   name: string;
   ip: string;
   radar_id: number;
   enabled: boolean;
   remark: string;
   personnel_id?: number | null; // Add the personnel_id field (optional)
   alarm?: boolean;
   heartRate?: number;
   breathRate?: number;
   distance?: number;
   mattress_distance?: number; // Add mattress_distance (optional)
   time?: number; // Add time (optional)
   personnel_name?: string; // Add personnel_name (optional)
   schedules?: PersonnelSchedule[]; // Add the schedules property
   networkFailure?: boolean; // Add networkFailure (optional)
   radarFailure?: boolean; // Add radarFailure (optional)
   radarAbnormal?: boolean; // Add radar  (optional)
   person_pose?: string; // Add person_pose (optional)
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
   id?: number; // Optional for new personnel
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
