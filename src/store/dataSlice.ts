// store/dataSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Room } from "../types";

interface DataState {
   rooms: Room[];
   alarms: any[]; // Adjust the type based on your actual alarm data structure
}

const initialState: DataState = {
   rooms: [],
   alarms: [],
};

const dataSlice = createSlice({
   name: "data",
   initialState,
   reducers: {
      setRooms: (state, action: PayloadAction<Room[]>) => {
         state.rooms = action.payload;
      },
      updateRoomData: (state, action: PayloadAction<{ roomId: number; data: any }>) => {
         // Adjust 'data' type as needed
         const { roomId, data } = action.payload;
         const roomIndex = state.rooms.findIndex((room) => room.id === roomId);
         if (roomIndex !== -1) {
            state.rooms[roomIndex] = {
               ...state.rooms[roomIndex],
               ...data,
               // networkFailure: false,
               // radarFailure: false,
               // radarAbnormal: false,
            };
         }
      },
      addAlarm: (state, action: PayloadAction<any>) => {
         const newAlarm = action.payload;
         const existingAlarmIndex = state.alarms.findIndex((alarm) => alarm.roomId === newAlarm.roomId);

         if (existingAlarmIndex !== -1) {
            // If an alarm for the same roomId exists, replace it
            state.alarms[existingAlarmIndex] = newAlarm;
         } else {
            // Otherwise, add the new alarm
            state.alarms.push(newAlarm);
         }
      },
      clearAlarms: (state) => {
         state.alarms = [];
      },
      removeAlarm: (state, action: PayloadAction<number>) => {
         // 接收 roomId 作为参数
         state.alarms = state.alarms.filter((alarm) => alarm.id !== action.payload);
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
   },
});

export const {
   setRooms,
   updateRoomData,
   addAlarm,
   clearAlarms,
   removeAlarm,
   setRoomNetworkFailure,
   setRoomRadarFailure,
   setRoomRadarAbnormal,
} = dataSlice.actions;
export default dataSlice.reducer;
