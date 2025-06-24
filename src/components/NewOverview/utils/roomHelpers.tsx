import React from "react";
import { FaBed, FaChair, FaWalking } from "react-icons/fa";
import dayjs from "dayjs";
import { Room, TagInfo } from "../types";
import { ALARM_LEVEL_TEXT, ICON_SIZE, DISTANCE_THRESHOLDS } from "./constants";
import { MEDICAL_HISTORIES } from "../../../types";

/**
 * 获取报警级别文本
 */
export const getAlarmLevelText = (level: number): string => {
   return ALARM_LEVEL_TEXT[level as keyof typeof ALARM_LEVEL_TEXT] || "";
};

/**
 * 根据房间ID获取房间名称
 */
export const getRoomNameById = (roomId: number, rooms: Room[]): string => {
   const room = rooms.find((r) => r.id === roomId);
   return room ? room.name : `未知房间(${roomId})`;
};

/**
 * 获取设备数据（优先使用手环数据）
 */
export const getDeviceData = (devices: any) => {
   // 优先使用手环数据
   const braceletHeartRate = devices.bracelet?.heartRate;

   // 处理雷达数据（过滤掉0值，优先使用第一个有效数据）
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

/**
 * 获取报警显示文本
 */
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

   const text = `${timeStr}${levelText ? `【${levelText}】` : ""} ${roomName} - ${alarm.message} | 心率：${
      alarm.heartRate || "-"
   } 呼吸率：${alarm.breathRate || "-"} 距离：${alarm.distance ? (alarm.distance / 100).toFixed(2) + "m" : "-"} `;

   return {
      title: text,
      content: text,
   };
};

/**
 * 判断是否在限制时段内
 */
export const isInRestrictedSchedule = (room: Room): boolean => {
   if (!room.personnel_id || !room.schedules || room.schedules.length === 0) {
      return false; // 没有关联人员或时间表，不受限制
   }

   const now = dayjs();
   const currentYear = now.year();
   const currentMonth = now.month() + 1; // 月份从0开始
   const currentDay = now.date();
   const currentHour = now.hour();
   const currentMinute = now.minute();

   const currentDateTime = dayjs(new Date(currentYear, currentMonth - 1, currentDay, currentHour, currentMinute));

   for (const schedule of room.schedules) {
      const daysOfWeek = JSON.parse(schedule.days_of_week);

      for (const dateRange of daysOfWeek) {
         const [startDate, endDate] = dateRange.map((date: string) => dayjs(date, "YYYY-MM-DD"));
         let date = startDate;

         while (date.isBefore(endDate) || date.isSame(endDate, "day")) {
            const [startHour, startMinute] = schedule.start_time.split(":").map(Number);
            const [endHour, endMinute] = schedule.end_time.split(":").map(Number);

            let startDateTime = date.hour(startHour).minute(startMinute);
            let endDateTime = date.hour(endHour).minute(endMinute);

            // 处理跨天的时间表
            if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
               endDateTime = endDateTime.add(1, "day"); // 将结束时间移至次日
            }

            if (currentDateTime.isAfter(startDateTime) && currentDateTime.isBefore(endDateTime)) {
               return true; // 在限制时段内
            }

            date = date.add(1, "day"); // 移至下一天
         }
      }
   }

   return false; // 不在任何限制时段内
};

/**
 * 获取标签信息
 */
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

/**
 * 获取姿态图标
 */
export const getIcon = (roomAndRadarData: any): React.ReactElement => {
   if (roomAndRadarData.person_pose === "坐姿" || !roomAndRadarData.mattress_distance) {
      return <FaChair color='orange' />;
   }

   const distanceValue =
      roomAndRadarData.mattress_distance - (roomAndRadarData.distance ? roomAndRadarData.distance * 100 : 0);

   if (distanceValue === 0 || roomAndRadarData.distance === undefined) {
      return <FaWalking color='red' style={{ fontSize: ICON_SIZE + "px" }} />; // 离开图标
   } else if (distanceValue < DISTANCE_THRESHOLDS.BED) {
      return <FaBed color='green' style={{ fontSize: ICON_SIZE + "px" }} />; // 卧床图标
   } else if (distanceValue < DISTANCE_THRESHOLDS.CHAIR) {
      return <FaChair color='orange' style={{ fontSize: ICON_SIZE + "px" }} />; // 坐姿图标
   } else {
      return <FaWalking color='red' style={{ fontSize: ICON_SIZE + "px" }} />; // 离开图标
   }
};
