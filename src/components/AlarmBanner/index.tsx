import React, { useState, useEffect, useRef } from "react";
import { Alert, Button, message, Space } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { MEDICAL_HISTORIES } from "../../types";
import { removeAlarm } from "../../store/dataSlice";
import axios from "axios";
import config from "../../config";
import { createSelector } from "reselect";

const getAlarmLevelText = (level: number) => {
   switch (level) {
      case 1:
         return "极度危险";
      case 2:
         return "危险";
      case 3:
         return "异常";
      default:
         return "未知";
   }
};

const AlarmBanner: React.FC = () => {
   const selectUser = (state: RootState) => state.user;

   const selectUserAuthInfo = createSelector(selectUser, (user) => ({
      isAuthenticated: user.isAuthenticated,
      role: user.role,
      room_id: user.room_id,
   }));
   const { isAuthenticated, role, room_id } = useSelector(selectUserAuthInfo);
   const alarms = useSelector(
      (state: RootState) =>
         isAuthenticated &&
         (role === "user" ? state.data.alarms.filter((alarm) => alarm.roomId === room_id) : state.data.alarms)
   );

   const dispatch = useDispatch();

   const audioRef = useRef<HTMLAudioElement | null>(null); // 用于存储 audio 元素的引用

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

   const handleAlarm = async (alarmId: number, action: string) => {
      try {
         // Call the backend API to update the alarm entry
         await axios.put(`${config.backend.url}/history/alarms/${alarmId}`, {
            handling_method: action,
         });

         dispatch(removeAlarm(alarmId));
         message.success("报警处理成功");
      } catch (error) {
         console.error("Error handling alarm:", error);
         message.error("报警处理失败！");
      }
   };
   return (
      <>
         {alarms && alarms.length > 0 && (
            <div
               style={{
                  position: "fixed",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  maxHeight: "300px",
                  zIndex: 1000, // Ensure it's on top
               }}
            >
               {alarms.map((alarm) => (
                  <Alert
                     type={
                        (["error", "warning", "info", "success"][alarm.level - 1] || "info") as
                           | "error"
                           | "warning"
                           | "info"
                           | "success"
                     }
                     key={alarm.roomId}
                     message={
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                           <span>
                              {`${new Date().toLocaleTimeString("zh-CN", { hour12: false })}【${getAlarmLevelText(
                                 alarm.level
                              )}】 ${alarm.message} `}
                              {alarm.medicalHistoryCode &&
                                 `（个人病史：${
                                    MEDICAL_HISTORIES.find((item) => item.value === alarm.medicalHistoryCode)?.label +
                                       (alarm.remark ? " " + alarm.remark : "") || "未知"
                                 }）`}
                           </span>
                           {alarm.level < 3 && (
                              <Space>
                                 <Button type='primary' size='small' onClick={() => handleAlarm(alarm.id, "立即处理")}>
                                    立即处理
                                 </Button>
                                 <Button size='small' onClick={() => handleAlarm(alarm.id, "忽略")}>
                                    忽略
                                 </Button>
                              </Space>
                           )}
                        </div>
                     }
                     banner
                     closable={false} // Disable close button
                     style={{ backgroundColor: "#ffe58f" }}
                  />
               ))}
            </div>
         )}
      </>
   );
};

export default AlarmBanner;
