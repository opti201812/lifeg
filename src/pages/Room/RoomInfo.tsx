// pages/Room/RoomInfo.tsx

import React from "react";
import { Tag, Typography } from "antd";
import { Room } from "../../types";
import dayjs from "dayjs";

// Function to check if current time is within restricted schedule
const isInRestrictedSchedule = (room: Room) => {
   if (!room.personnel_id || !room.schedules || room.schedules.length === 0) {
      return false; // No personnel or schedules, not restricted
   }

   const now = dayjs();
   const currentYear = now.year();
   const currentMonth = now.month() + 1; // Months are 0-based
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

            // Handle cross-day schedules
            if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
               endDateTime = endDateTime.add(1, "day"); // Move end time to the next day
            }

            if (currentDateTime.isAfter(startDateTime) && currentDateTime.isBefore(endDateTime)) {
               return true; // Within restricted time
            }

            date = date.add(1, "day"); // Move to the next day
         }
      }
   }

   return false; // Not within any restricted schedule
};

const getTagInfo = (room: Room | undefined) => {
   if (!room) {
      return { text: "无数据", color: "gray" };
   }
   if (!room.personnel_id) {
      return { text: "无人", color: "gray" };
   } else if (!room.enabled) {
      return { text: "未设防", color: "red" };
   } else if (isInRestrictedSchedule(room)) {
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

export const RoomInfo: React.FC<{
   roomName: string;
   age: number;
   gender: string;
   type: string;
   room: Room | undefined;
}> = ({ roomName, age, gender, type, room }) => {
   return (
      <div
         style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
         }}
      >
         <Typography.Title level={5} style={{ margin: 0 }}>
            {type ? type + "曲线" : "实时数据"}
         </Typography.Title>

         <div>
            <Tag color={getTagInfo(room).color}>{getTagInfo(room).text}</Tag> {/* Use getTagInfo */}
            <Tag color='blue'>房间：{roomName}</Tag>
            <Tag color='green'>年龄：{age || ""}</Tag>
            <Tag color='purple'>性别：{gender || ""}</Tag>
         </div>
      </div>
   );
};
