// store/dataSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
   Room,
   Personnel,
   Radar,
   User,
   RoomType,
   TemplateType,
   BraceletData,
   RadarData,
   PersonnelState,
   AggregatedData,
   RoomTemplate,
} from "../types";

interface Association {
   id?: number;
   associationId?: number;
   personnelId: number;
   braceletId: string | null;
   roomId: number;
   radarIds: string[];
}

interface DataState {
   rooms: Room[];
   radars: Radar[]; // 新增雷达数据数组
   personnel: Personnel[]; // 新增人员数据数组
   associations: Association[]; // 新增关联数据数组
   alarms: any[]; // Adjust the type based on your actual alarm data structure
   roomTypes: RoomType[];
   personDeviceData: Record<number, any>; // 新增字段用于存储人员设备数据
   roomTemplates: RoomTemplate[];
}

const initialState: DataState = {
   rooms: [],
   radars: [], // 初始化雷达数据
   personnel: [], // 初始化人员数据
   associations: [], // 初始化关联数据
   alarms: [],
   roomTypes: [],
   personDeviceData: {}, // 初始化人员设备数据
   roomTemplates: [],
};

const dataSlice = createSlice({
   name: "data",
   initialState,
   reducers: {
      setRooms: (state, action: PayloadAction<Room[]>) => {
         state.rooms = action.payload;
      },
      setRadars: (state, action: PayloadAction<Radar[]>) => {
         state.radars = action.payload;
      },
      setPersonnel: (state, action: PayloadAction<Personnel[]>) => {
         state.personnel = action.payload;
      },
      setAssociations: (state, action: PayloadAction<Association[]>) => {
         state.associations = action.payload;
      },
      updateRadarStatus: (state, action: PayloadAction<{ radarId: string | number; status: any }>) => {
         const { radarId, status } = action.payload;
         const radarIndex = state.radars.findIndex((radar) => radar.id === radarId);
         if (radarIndex !== -1) {
            state.radars[radarIndex] = {
               ...state.radars[radarIndex],
               ...status,
            };
         }
      },
      updateRoomData: (state, action: PayloadAction<{ roomId: number; data: any }>) => {
         const { roomId, data } = action.payload;
         const roomIndex = state.rooms.findIndex((room) => room.id === roomId);
         if (roomIndex !== -1) {
            state.rooms[roomIndex] = {
               ...state.rooms[roomIndex],
               ...data,
            };
         }
      },
      addAlarm: (state, action: PayloadAction<any>) => {
         const newAlarm = { ...action.payload, createTimeStamp: Date.now() };
         const existingAlarmIndex = state.alarms.findIndex((alarm) => alarm.roomId === newAlarm.roomId);

         if (existingAlarmIndex !== -1) {
            state.alarms[existingAlarmIndex] = newAlarm;
         } else {
            state.alarms.push(newAlarm);
         }
      },
      clearAlarms: (state) => {
         state.alarms = [];
      },
      removeAlarm: (state, action: PayloadAction<number>) => {
         state.alarms = state.alarms.filter((alarm) => alarm.id !== action.payload);
      },
      updatePersonnelDeviceData: (state, action: PayloadAction<{ personnelId: number; data: any }>) => {
         const { personnelId, data } = action.payload;

         // 更新人员设备数据
         state.personDeviceData[personnelId] = {
            ...state.personDeviceData[personnelId],
            ...data,
         };
      },
      setRoomNetworkFailure: (state, action: PayloadAction<{ roomId: number; status: boolean }>) => {
         const { roomId, status } = action.payload;
         const roomIndex = state.rooms.findIndex((room) => room.id === roomId);
         if (roomIndex !== -1) {
            state.rooms[roomIndex] = { ...state.rooms[roomIndex], networkFailure: status };
         }
      },
      setRoomRadarFailure: (state, action: PayloadAction<{ roomId: number; status: boolean }>) => {
         const { roomId, status } = action.payload;
         const roomIndex = state.rooms.findIndex((room) => room.id === roomId);
         if (roomIndex !== -1) {
            state.rooms[roomIndex] = { ...state.rooms[roomIndex], radarFailure: status, networkFailure: false };
         }
      },
      setRoomRadarAbnormal: (state, action: PayloadAction<{ roomId: number; status: boolean }>) => {
         const { roomId, status } = action.payload;
         const roomIndex = state.rooms.findIndex((room) => room.id === roomId);
         if (roomIndex !== -1) {
            state.rooms[roomIndex] = {
               ...state.rooms[roomIndex],
               radarAbnormal: status,
               radarFailure: false,
               networkFailure: false,
            };
         }
      },
      setCustomRoomTypes: (state, action: PayloadAction<RoomType[]>) => {
         state.roomTypes = action.payload;
      },
      addCustomRoomType: (state, action: PayloadAction<RoomType>) => {
         state.roomTypes.push(action.payload);
      },
      updateCustomRoomType: (state, action: PayloadAction<RoomType>) => {
         const index = state.roomTypes.findIndex((type) => type.typeId === action.payload.typeId);
         if (index !== -1) {
            state.roomTypes[index] = action.payload;
         }
      },
      deleteCustomRoomType: (state, action: PayloadAction<number>) => {
         state.roomTypes = state.roomTypes.filter((type) => type.typeId !== action.payload);
      },
      updateBraceletData: (state, action: PayloadAction<{ personnelId: number; data: BraceletData }>) => {
         state.rooms.forEach((room) => {
            const personnel = room.state?.personnel?.find((p) => p.id === action.payload.personnelId);
            if (personnel) {
               personnel.devices.bracelet = action.payload.data;
               personnel.aggregatedData = aggregateData(personnel);
            }
         });
      },
      updateRadarData: (state, action: PayloadAction<{ personnelId: number; data: RadarData }>) => {
         state.rooms.forEach((room) => {
            const personnel = room.state?.personnel?.find((p) => p.id === action.payload.personnelId);
            if (personnel) {
               const index = personnel.devices.radars.findIndex((r) => r.id === action.payload.data.id);
               if (index !== -1) {
                  personnel.devices.radars[index] = action.payload.data;
                  personnel.aggregatedData = aggregateData(personnel);
               }
            }
         });
      },
      setRoomTemplates: (state, action: PayloadAction<RoomTemplate[]>) => {
         state.roomTemplates = action.payload;
      },
      setRoomTypes: (state, action) => {
         state.roomTypes = action.payload;
      },
   },
});

const aggregateData = (personnel: PersonnelState): AggregatedData => {
   const validRadars = personnel.devices.radars.filter((r: RadarData) => Date.now() - r.lastUpdate < 5000);

   return {
      heartRate:
         personnel.devices.bracelet?.heartRate ||
         Math.round(validRadars.reduce((sum: number, r: RadarData) => sum + r.heartRate, 0) / validRadars.length),
      breathRate:
         personnel.devices.bracelet?.breathRate ||
         Math.round(validRadars.reduce((sum: number, r: RadarData) => sum + r.breathRate, 0) / validRadars.length),
      posture:
         validRadars.reduce((acc: Record<string, number>, r: RadarData) => {
            acc[r.posture] = (acc[r.posture] || 0) + 1;
            return acc;
         }, {} as Record<string, number>)["坐姿"] >
         validRadars.length / 2
            ? "坐姿"
            : "卧姿",
      distance: Math.round(validRadars.reduce((sum: number, r: RadarData) => sum + r.distance, 0) / validRadars.length),
   };
};

export const {
   setRooms,
   setRadars,
   setPersonnel,
   setAssociations,
   updateRadarStatus,
   updateRoomData,
   addAlarm,
   clearAlarms,
   removeAlarm,
   setRoomNetworkFailure,
   setRoomRadarFailure,
   setRoomRadarAbnormal,
   setCustomRoomTypes,
   addCustomRoomType,
   updateCustomRoomType,
   deleteCustomRoomType,
   updateBraceletData,
   updateRadarData,
   updatePersonnelDeviceData,
   setRoomTemplates,
   setRoomTypes,
} = dataSlice.actions;

export default dataSlice.reducer;
