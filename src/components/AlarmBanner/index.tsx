import React, { useState, useEffect, useRef } from "react";
import { Alert, Button, message, Space } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { MEDICAL_HISTORIES, Room } from "../../types";
import { removeAlarm } from "../../store/dataSlice";
import axios from "axios";
import config from "../../config";
import { createSelector } from "@reduxjs/toolkit";
import { theme } from "../../styles/theme";
import { normalizeRadarDistanceToMeters } from "../../shared/src/utils/radarDistance";

interface AlarmDevices {
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

const getAlarmLevelText = (level: number) => {
   switch (level) {
      case 1:
         return "极度危险";
      case 2:
         return "危险";
      case 3:
         return "异常";
      default:
         return "";
   }
};

// 在组件外部定义记忆化选择器
const selectFilteredAlarms = createSelector(
   [
      (state: RootState) => state.data.alarms,
      (state: RootState) => state.user.role,
      (state: RootState) => state.user.room_id,
   ],
   (alarms, role, room_id) => alarms.filter((alarm) => role === "admin" || alarm.room_id === room_id)
);

// 新增工具方法
const getRoomNameById = (roomId: number, rooms: Room[]) => {
   const room = rooms.find((r) => r.id === roomId);
   return room ? room.name : `未知房间(${roomId})`;
};

const getDeviceData = (devices: AlarmDevices) => {
   // 优先使用手环数据
   const braceletHeartRate = devices.bracelet?.heartRate;

   // 处理雷达数据（过滤掉0值，优先使用第一个有效数据）
   const validRadars = devices.radar?.filter((r) => (r.heartRate || 0) > 0) || [];
   const primaryRadar = validRadars[0] || devices.radar?.[0];

   return {
      heartRate: braceletHeartRate ?? primaryRadar?.heartRate ?? "",
      breathRate: primaryRadar?.breathRate ?? "",
      distance: primaryRadar?.distance ?? "",
      pose: primaryRadar?.pose ?? "",
      environment: primaryRadar?.environment ?? "",
   };
};

// 新增方法
const getAlarmDisplayText = (alarm: any, rooms: Room[]) => {
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

   // const text = `${timeStr}${levelText ? `【${levelText}】` : ""} ${roomName} - ${alarm.message} | 心率：${
   //    alarm.heartRate || "-"
   // } 呼吸率：${alarm.breathRate || "-"} 距离：${alarm.distance ? (alarm.distance / 100).toFixed(2) + "m" : "-"} 姿态：${
   //    alarm.pose || "-"
   // } 环境：${alarm.environment || "-"}${medicalHistoryText}`;

   return {
      title: text,
      content: text,
   };
};

const AlarmBanner: React.FC = () => {
   const selectUser = (state: RootState) => state.user;

   const selectUserAuthInfo = createSelector(selectUser, (user) => ({
      isAuthenticated: user.isAuthenticated,
      role: user.role,
      room_id: user.room_id,
   }));
   const { isAuthenticated, role, room_id } = useSelector(selectUserAuthInfo);

   if (!isAuthenticated) {
      return null;
   }
   // 修改后的 alarms 选择器使用
   const alarms = useSelector(selectFilteredAlarms);

   const dispatch = useDispatch();

   const audioRef = useRef<HTMLAudioElement | null>(null); // 用于存储 audio 元素的引用

   // 获取房间列表
   const rooms = useSelector((state: RootState) => state.data.rooms);

   useEffect(() => {
      // 检查alarms各项level是否均大于2，如果是，则停止播放声音
      if (alarms && alarms.length > 0) {
         const allLowLevel = alarms.every((alarm) => alarm.level > 2);
         if (allLowLevel) {
            if (audioRef.current) {
               audioRef.current.pause();
               audioRef.current.currentTime = 0; // Reset playback position
            }
            return;
         }
      }
      // 当 alarms 变化时，控制声音播放
      if (alarms && alarms.length > 0) {
         const alertSound = localStorage.getItem("alertSound") || "alarm_001.mp3";
         const soundUrl = `/sounds/${alertSound}`;
         if (!audioRef.current) {
            audioRef.current = new Audio(soundUrl);
            audioRef.current.loop = true; // 循环播放
         }
         audioRef.current.play().catch((error) => {
            console.error("Error playing alarm sound:", error);
         });
      } else {
         if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0; // Reset playback position
         }
      }
   }, [alarms]);

   const handleAlarm = async (alarmId: number, action: string, personnelId: number) => {
      try {
         // Call the backend API to update the alarm entry
         await axios.put(`${config.backend.url}/history/alarms/${alarmId}`, {
            handling_method: action,
            personnelId,
         });

         dispatch(removeAlarm(alarmId));
         message.success("报警处理成功");
      } catch (error) {
         console.error("Error handling alarm:", error);
         message.error("报警处理失败！");
      }
   };

   const flattenedAlarms = alarms.map((alarm) => {
      const deviceData = getDeviceData(alarm.devices);
      const roomName = getRoomNameById(alarm.roomId, rooms);

      return {
         ...alarm.alarm.params,
         id: alarm.id,
         alarmTime: alarm.alarmTime,
         personnelId: alarm.personnelId,
         roomId: alarm.roomId,
         roomName,
         queueTimestamp: alarm.queueTimestamp,
         ...deviceData,
      };
   });

   return (
      <div
         style={{
            position: "fixed",
            bottom: 0,
            left: 200,
            maxHeight: "300px",
            width: "calc(100% - 200px)",
            overflow: "auto",
            zIndex: 1000,
         }}
      >
         <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between" }}>
            {flattenedAlarms.slice(0, 6).map((alarm, index) => {
               const isSingleInRow = index % 2 === 0 && index === flattenedAlarms.length - 1;
               const { title, content } = getAlarmDisplayText(alarm, rooms);

               return (
                  <div
                     style={{
                        width: isSingleInRow ? "100%" : "50%",
                        boxSizing: "border-box",
                        padding: "5px",
                     }}
                     key={index}
                  >
                     <Alert
                        type={
                           (["error", "warning", "info", "success"][alarm.level - 1] || "info") as
                              | "error"
                              | "warning"
                              | "info"
                              | "success"
                        }
                        message={
                           <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span
                                 style={{
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    maxWidth: "100%",
                                 }}
                                 title={title}
                              >
                                 {content}
                              </span>
                              {alarm.level < 3 && (
                                 <Space style={{ display: "none" }}>
                                    <Button
                                       type='primary'
                                       size='small'
                                       onClick={() => handleAlarm(alarm.id, "立即处理", alarm.personnelId)}
                                    >
                                       立即处理
                                    </Button>
                                    <Button
                                       size='small'
                                       onClick={() => handleAlarm(alarm.id, "忽略", alarm.personnelId)}
                                    >
                                       忽略
                                    </Button>
                                 </Space>
                              )}
                           </div>
                        }
                        banner
                        closable={false}
                        style={{ backgroundColor: theme.alarmBannerBackgroundColor }}
                     />
                  </div>
               );
            })}
         </div>
      </div>
   );
};

export default AlarmBanner;
