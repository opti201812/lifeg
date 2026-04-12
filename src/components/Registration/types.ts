// 检录记录数据结构
export interface RegistrationRecord {
   id: string;
   personnelId: number;
   associationId?: number;
   name: string;
   idNumber: string;
   gender: string;
   age: number;
   braceletId?: string;
   oximeterId?: string;
   oximeterEnabled: boolean;
   heartRate?: number;
   breathRate?: number;
   spo2?: number;
   bodyTemperature?: number;
   systolicPressure?: number;
   diastolicPressure?: number;
   restingHeartRate?: number;
   restingBreathRate?: number;
   medicalHistory?: string[];
   remarks?: string;
   registrationTime: string;
   status: "pending" | "completed";
   // 监测基准值
   thresholds?: {
      heartRateBase?: number;
      breathRateBase?: number;
      restingHeartRateBase?: number;
      restingBreathRateBase?: number;
      spo2Base?: number;
      bodyTemperatureBase?: number;
      systolicPressureBase?: number;
      diastolicPressureBase?: number;
   };
}

// 检录表单数据结构
export interface RegistrationFormValues {
   name: string;
   idNumber: string;
   gender: string;
   age: number | string;
   braceletId?: string | null;
   oximeterId?: string;
   medicalHistory?: string[];
   remarks?: string;
   heartRate: number | string;
   breathRate: number | string;
   restingHeartRate: number | string;
   restingBreathRate: number | string;
   spo2?: number | string;
   bodyTemperature?: number | string;
   systolicPressure?: number | string;
   diastolicPressure?: number | string;
   // 监测基准值
   heartRateBase?: number | string;
   breathRateBase?: number | string;
   restingHeartRateBase?: number | string;
   restingBreathRateBase?: number | string;
   spo2Base?: number | string;
   bodyTemperatureBase?: number | string;
   systolicPressureBase?: number | string;
   diastolicPressureBase?: number | string;
}

// 人员 API 响应
export interface PersonnelData {
   id: number;
   name: string;
   id_number: string;
   gender: string;
   age: number;
   medical_history?: string[];
   remark?: string;
   heart_rate?: number;
   breath_rate?: number;
   heart_rate_resting?: number;
   breath_rate_resting?: number;
   lastUpdate?: number;
   is_out?: boolean;
}

// 关联 API 响应
export interface AssociationData {
   id: number;
   personnelId: number;
   braceletId?: string;
   oximeterId?: string;
   roomId?: number;
   radarId?: string;
   heartRate?: number;
   breathRate?: number;
   restingHeartRate?: number;
   restingBreathRate?: number;
}

// 手环 API 响应
export interface BraceletResponse {
   onlineBracelets: BraceletDevice[];
   offlineBracelets: BraceletDevice[];
}

// 手环设备详细信息
export interface BraceletDevice {
   deviceId: string;
   isOnline: boolean;
   lastUpdateTime: number;
   lastUpdateTimeISO: string;
   offlineMinutes: number;
   data: {
      heartRate: number;
      batteryVoltage: number;
      tamperStatus: number;
      buttonStatus: number;
   };
}

// 血氧仪配置信息（/v1/oximeter-status/config 响应）
export interface OximeterConfigResponse {
   success: boolean;
   ok: boolean;
   data: {
      deviceId: string;
      deviceName: string;
      connectedAt: string;
   } | null;
}

// 血氧仪状态 API 响应
export interface OximeterResponse {
   success: boolean;
   timestamp: number;
   timestampISO: string;
   totalOximeters: number;
   onlineCount: number;
   offlineCount: number;
   config?: OximeterConfig | null;
   onlineOximeters: OximeterDevice[];
   offlineOximeters: OximeterDevice[];
}

// 血氧仪设备详细信息
export interface OximeterDevice {
   deviceId: string;
   isOnline: boolean;
   isConfigured: boolean;
   lastUpdateTime: number;
   lastUpdateTimeISO: string;
   offlineMinutes: number;
   data: {
      spo2: number;
      heartRate: number;
      breathRate?: number;
      bodyTemperature?: number;
      systolicPressure?: number;
      diastolicPressure?: number;
      batteryVoltage?: number;
   };
}

// 血氧仪配置信息
export interface OximeterConfig {
   deviceId: string;
   deviceName: string;
   connectedAt: string;
}
