// components/AlarmBanner/index.tsx
import React, { useState, useEffect } from "react";
import { Alert, Button, Space } from "antd";
import { WarningOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useLocation, useNavigate } from "react-router-dom";

const AlarmBanner: React.FC = () => {
   const [alarms, setAlarms] = useState<{ roomId: number; message: string; medicalHistory?: string }[]>([]);
   const location = useLocation();
   const navigate = useNavigate();
   const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);

   useEffect(() => {
      // 模拟从后端获取报警信息
      const fetchAlarms = async () => {
         // Replace with your actual API call to fetch alarm data
         const mockAlarms = [
            {
               roomId: 1,
               message: "心率过高！当前心率：99次/分",
               medicalHistory: "窦性心动过速",
            },
            {
               roomId: 5,
               message: "呼吸过快！当前呼吸频率：32次/分。",
            },
         ];
         setAlarms(mockAlarms);
      };

      // 仅在登录后且不在登录页面时获取报警信息
      if (isAuthenticated && location.pathname !== "/login") {
         fetchAlarms();
      } else {
         setAlarms([]); // Clear alarms when not authenticated or on login page
      }
   }, [isAuthenticated, location.pathname]);

   const handleImmediateAction = (roomId: number) => {
      // Handle immediate action (e.g., navigate to the room page)
      navigate(`/room?roomId=${roomId}`);
   };

   const handleIgnore = (roomId: number) => {
      // Handle ignore action (e.g., remove the alarm from the list)
      setAlarms(alarms.filter((alarm) => alarm.roomId !== roomId));
   };

   return (
      <>
         {alarms.length > 0 && (
            <div
               style={{
                  position: "fixed",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  zIndex: 1000, // Ensure it's on top
               }}
            >
               {alarms.map((alarm) => (
                  <Alert
                     key={alarm.roomId}
                     message={
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                           <span>
                              {/* <WarningOutlined style={{ marginRight: 8 }} /> */}
                              请注意！ 房间 {alarm.roomId}: {alarm.message}{" "}
                              {alarm.medicalHistory && `（个人病史：${alarm.medicalHistory}）`}
                           </span>
                           <Space>
                              <Button type='primary' size='small' onClick={() => handleImmediateAction(alarm.roomId)}>
                                 立即处理
                              </Button>
                              <Button size='small' onClick={() => handleIgnore(alarm.roomId)}>
                                 忽略一次
                              </Button>
                           </Space>
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
