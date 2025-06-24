import { RadarData, Personnel, Room as BaseRoom } from "../../../types";

export interface Room {
   id: number;
   name: string;
   typeId: number;
   enabled?: boolean;
   personnelName?: string;
   personnel_id?: number;
   person_pose?: string;
   mattress_distance?: number;
   distance?: number;
   heartRate?: number;
   breathRate?: number;
   environmentInterference?: any;
   networkFailure?: boolean;
   radarFailure?: boolean;
   radarAbnormal?: boolean;
   schedules?: any[];
   remark?: string;
   config?: {
      maxPersonnel: number;
   };
   maxPersonnel?: number;
}

export interface Association {
   id?: number;
   associationId?: number;
   personnelId: number;
   braceletId: string | null;
   roomId: number;
   radarIds: string[];
}

// 直接使用原有的Personnel类型
export type { Personnel };

export interface RoomPersonnel {
   room: Room;
   personnel: Personnel | null;
   associationId: string;
   sortType?: number;
}

export interface AlarmDevices {
   radar?: Array<{
      heartRate?: number;
      breathRate?: number;
      distance?: number;
      pose?: string;
      environment?: number;
   }>;
   bracelet?: {
      heartRate?: number;
   };
}

export interface TagInfo {
   text: string;
   color: string;
}

export interface DeviceData {
   heartRate: number | string;
   breathRate: number | string;
   distance: number | string;
   pose: string;
   environment: number | string;
}

export interface SelectedRoom {
   roomId: number;
   roomInfo: {
      name: string;
      age: number;
      gender: string;
      personnelId?: number | null;
   };
   associationId: string;
   initialSlide: number;
}
