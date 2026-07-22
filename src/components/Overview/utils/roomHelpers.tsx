import React from "react";
import { FaBed, FaChair, FaWalking } from "react-icons/fa";
import dayjs from "dayjs";
import { Room, TagInfo } from "../types";
import { ALARM_LEVEL_TEXT, ICON_SIZE, DISTANCE_THRESHOLDS } from "./constants";
import { MEDICAL_HISTORIES } from "../../../types";
import { normalizeRadarDistanceToMeters, normalizeRadarDistanceToCm } from "../../../shared/src/utils/radarDistance";

export const getAlarmLevelText = (level: number): string => {
   return ALARM_LEVEL_TEXT[level as keyof typeof ALARM_LEVEL_TEXT] || "";
};

export const getRoomNameById = (roomId: number, rooms: Room[]): string => {
   const room = rooms.find((r) => r.id === roomId);
   return room ? room.name : `未知房间(${roomId})`;
};

export const getDeviceData = (devices: any) => {
   const braceletHeartRate = devices.bracelet?.heartRate;
   const validRadars = devices.radar?.filter((r: any) => (r.heartRate || 0) > 0) || [];
   const primaryRadar = validRadars[0] || devices.radar?.[0];

   return {
      heartRate: braceletHeartRate ?? primaryRadar?.heartRate ?? "",
      breathRate: primaryRadar?.breathRate ?? "",
      distance: primaryRadar?.distance ?? "",
      pose: primaryRadar?.pose ?? "",
      environment: primaryRadar?.environment ?? "",
   };
};

export const getAlarmDisplayText = (alarm: any, rooms: Room[]) => {
   const roomName = getRoomNameById(alarm.roomId, rooms);
   const timeStr = new Date(alarm.alarmTime).toLocaleTimeString("zh-CN", { hour12: false });
   const levelText = getAlarmLevelText(alarm.level);

   const medicalHistoryText = alarm.medicalHistoryCode
      ? `（个人病史：${
           MEDICAL_HISTORIES.find((item) => item.value === alarm.medicalHistoryCode)?.label +
              (alarm.remark ? " " + alarm.remark : "") || "未知"
        }）`
      : "";

   const distanceMeters = normalizeRadarDistanceToMeters(alarm.distance);
   const text = `${timeStr}${levelText ? `【${levelText}】` : ""} ${roomName} - ${alarm.message} | 心率：${
      alarm.heartRate || "-"
   } 呼吸率：${alarm.breathRate || "-"} 距离：${distanceMeters === null ? "-" : distanceMeters.toFixed(2) + "m"} `;

   return {
      title: text,
      content: text,
   };
};

export const isInRestrictedSchedule = (room: Room): boolean => {
   if (!room.personnel_id || !room.schedules || room.schedules.length === 0) {
      return false;
   }

   const now = dayjs();
   const currentYear = now.year();
   const currentMonth = now.month() + 1;
   const currentDay = now.date();
   const currentHour = now.hour();
   const currentMinute = now.minute();

   const currentDateTime = dayjs(new Date(currentYear, currentMonth - 1, currentDay, currentHour, currentMinute));

   for (const schedule of room.schedules as any[]) {
      const daysOfWeek = JSON.parse((schedule as any).days_of_week);

      for (const dateRange of daysOfWeek) {
         const [startDate, endDate] = dateRange.map((date: string) => dayjs(date, "YYYY-MM-DD"));
         let date = startDate;

         while (date.isBefore(endDate) || date.isSame(endDate, "day")) {
            const [startHour, startMinute] = (schedule as any).start_time.split(":").map(Number);
            const [endHour, endMinute] = (schedule as any).end_time.split(":").map(Number);

            let startDateTime = date.hour(startHour).minute(startMinute);
            let endDateTime = date.hour(endHour).minute(endMinute);

            if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
               endDateTime = endDateTime.add(1, "day");
            }

            if (currentDateTime.isAfter(startDateTime) && currentDateTime.isBefore(endDateTime)) {
               return true;
            }

            date = date.add(1, "day");
         }
      }
   }

   return false;
};

export const getTagInfo = (room: Room): TagInfo => {
   if (isInRestrictedSchedule(room)) {
      return { text: "搁置时段", color: "orange" };
   } else if (room.networkFailure) {
      return { text: "网络故障", color: "red" };
   } else if (room.radarFailure) {
      return { text: "雷达故障", color: "red" };
   } else if (room.radarAbnormal) {
      return { text: "雷达异常", color: "red" };
   } else {
      return { text: "采集中", color: "green" };
   }
};

export const getIcon = (roomAndRadarData: any): React.ReactElement => {
   if (roomAndRadarData.person_pose === "坐姿" || !roomAndRadarData.mattress_distance) {
      return <FaChair color='orange' />;
   }

   // mattress_distance 存储单位为厘米，此处把雷达距离统一归一化到厘米再作差
   const radarDistanceCm = normalizeRadarDistanceToCm(roomAndRadarData.distance);
   const distanceValue = roomAndRadarData.mattress_distance - (radarDistanceCm ?? 0);

   if (distanceValue === 0 || roomAndRadarData.distance === undefined) {
      return <FaWalking color='red' style={{ fontSize: ICON_SIZE + "px" }} />;
   } else if (distanceValue < DISTANCE_THRESHOLDS.BED) {
      return <FaBed color='green' style={{ fontSize: ICON_SIZE + "px" }} />;
   } else if (distanceValue < DISTANCE_THRESHOLDS.CHAIR) {
      return <FaChair color='orange' style={{ fontSize: ICON_SIZE + "px" }} />;
   } else {
      return <FaWalking color='red' style={{ fontSize: ICON_SIZE + "px" }} />;
   }
};
