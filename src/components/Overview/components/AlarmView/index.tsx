import React from "react";
import { Alert, Space, Button, message } from "antd";
import { Room } from "../../types";
import { createSelector } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import { RootState } from "../../../../store";
import { removeAlarm } from "../../../../store/dataSlice";
import { useDispatch } from "react-redux";
import axios from "axios";
import config from "../../../../config";

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

interface AlarmViewProps {
   alarms: any[];
   rooms: Room[];
   loading: boolean;
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

// 记忆化选择器
const selectFilteredAlarms = createSelector(
   [
      (state: RootState) => state.data.alarms,
      (state: RootState) => state.user.role,
      (state: RootState) => state.user.room_id,
   ],
   (alarms, role, room_id) => alarms.filter((alarm) => role === "admin" || alarm.room_id === room_id)
);

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

const AlarmView: React.FC<AlarmViewProps> = ({ alarms, rooms, loading }) => {
   const dispatch = useDispatch();
   const filteredAlarms = useSelector(selectFilteredAlarms);

   const handleAlarm = async (alarmId: number, action: string, personnelId: number) => {
      try {
         // TODO: 调用处理报警的API
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

   const flattenedAlarms = filteredAlarms.map((alarm) => {
      const deviceData = getDeviceData(alarm.devices);
      const roomName = getRoomNameById(alarm.roomId, rooms);

      return {
         ...alarm.alarm.params,
         alarmTime: alarm.alarmTime,
         personnelId: alarm.personnelId,
         roomId: alarm.roomId,
         roomName,
         queueTimestamp: alarm.queueTimestamp,
         ...deviceData,
      };
   });

   return (
      <div>
         <h3>实时报警</h3>
         <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between" }}>
            {flattenedAlarms.slice(0, 6).map((alarm, index) => {
               const isSingleInRow = index % 2 === 0 && index === flattenedAlarms.length - 1;
               const timeStr = new Date(alarm.alarmTime).toLocaleTimeString("zh-CN", { hour12: false });
               const levelText = getAlarmLevelText(alarm.level);
               const text = `${timeStr}${levelText ? `【${levelText}】` : ""} ${alarm.roomName} - ${
                  alarm.message
               } | 心率：${alarm.heartRate || "-"} 呼吸率：${alarm.breathRate || "-"} 距离：${
                  alarm.distance ? (alarm.distance / 100).toFixed(2) + "m" : "-"
               } `;

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
                                 title={text}
                              >
                                 {text}
                              </span>
                              {alarm.level < 3 && (
                                 <Space>
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
                     />
                  </div>
               );
            })}
         </div>
      </div>
   );
};

export default AlarmView;
