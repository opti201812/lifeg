// 设备数据类型定义
export interface DeviceData {
   devices: {
      radar: RadarDeviceData[] | null;
      bracelet: BraceletDeviceData | null;
   };
   type: string;
   id: number;
   time: string;
}

export interface RadarDeviceData {
   deviceId: number;
   distance: number;
   preciseDistance?: number;
   confidence: number;
   environmentInterference: number;
   heartRate: number;
   breathRate: number;
   dynamicStatus: number; // 0-卧姿，1-站立，2-坐姿
   fallStatus: number;
   timestamp: number;
   type: string;
   // 其他雷达字段...
}

export interface BraceletDeviceData {
   deviceId: string;
   heartRate?: number;
   battery?: number;
   sos?: boolean;
   status?: string;
   systolicPressure?: number;
   diastolicPressure?: number;
   bloodOxygen?: number;
   bodyTemperature?: number;
   timestamp: number;
   // 其他手环字段...
}

// 更新WebSocketMessage接口
export interface WebSocketMessage {
   type: string;
   data?: any;
   success?: boolean;
   personnelId?: number;
   roomId?: number;
}

// 添加到types文件中
export interface RoomType {
   typeId: number;
   typeName: string;
   templateId: number;
   remark: string;
}

export interface RoomTemplate {
   templateId: number;
   templateName: string;
   maxRadars: number;
   maxPersonnel: number;
   remark: string;
}
