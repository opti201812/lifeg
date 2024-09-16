// components/RoomPage/DailyDataSlide.tsx
import React, { useEffect } from "react";
import { Card, Row, Col, message } from "antd";
import ReactECharts from "echarts-for-react";
import { DataPoint } from "../../types";
import dayjs from "dayjs";
import { RoomInfo } from "./RoomInfo";
import RoomInfoFoot from "./RoomInfoFoot";
import axios from "axios";
import config from "../../config";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

interface DailyDataSlideProps {
   roomInfo: { name: string; age: number; gender: string; roomId: number; personnelId: number };
   isMonitoringEnabled: boolean;
}

const DailyDataSlide: React.FC<DailyDataSlideProps> = ({ roomInfo, isMonitoringEnabled }) => {
   const [dataDistance, setDataDistance] = React.useState<DataPoint[]>([]);
   const [dataHeartBeat, setDataHeartBeat] = React.useState<DataPoint[]>([]);
   const [dataBreathRate, setDataBreathRate] = React.useState<DataPoint[]>([]);
   const roomData = useSelector((state: RootState) => state.data.rooms.find((room) => room.id === roomInfo.roomId)); // Get room data from Redux store

   useEffect(() => {
      if (!isMonitoringEnabled) return;

      // Fetch historical data for the last 24 hours from the API
      const fetchHistoricalData = async () => {
         try {
            const oneDayAgo = dayjs().subtract(1, "day").format("YYYY-MM-DD HH:mm:ss");
            const now = dayjs().format("YYYY-MM-DD HH:mm:ss");

            const queryParams = new URLSearchParams({
               personnelId: roomInfo.personnelId.toString(),
               startDate: oneDayAgo,
               endDate: now,
            });

            const response = await axios.get(`${config.backend.url}/history?${queryParams.toString()}`);
            response.data.sort((a: any, b: any) => {
               const dateA = new Date(a.time);
               const dateB = new Date(b.time);
               return dateA.getTime() - dateB.getTime();
            });

            const processedData = response.data.map((item: any) => ({
               date: item.time,
               distance: item.target_distance / 100, // Convert to meters if needed
               heartbeat: item.heart_rate,
               breathing: item.breath_rate,
            }));
            setDataDistance(processedData.map((item: any) => ({ date: item.date, value: item.distance })));
            setDataHeartBeat(processedData.map((item: any) => ({ date: item.date, value: item.heartbeat })));
            setDataBreathRate(processedData.map((item: any) => ({ date: item.date, value: item.breathing })));
         } catch (error) {
            console.error("Error fetching historical data:", error);
            message.error("获取历史数据失败！");
         }
      };

      fetchHistoricalData();
      // 設置定時器，每分鐘重新獲取數據
      const intervalId = setInterval(fetchHistoricalData, 5 * 60 * 1000); // 60 seconds * 1000 milliseconds

      // 清理函數，在組件卸載時清除定時器
      return () => clearInterval(intervalId);
   }, [roomInfo.roomId]); // Re-fetch when roomId changes

   const getLineOptions = (data: DataPoint[], seriesName: string) => {
      // 计算最近 24 小时的时间范围
      const now = dayjs(); // 使用 dayjs.tz() 获取当前时间，并转换为后端时区
      const oneDayAgo = now.subtract(1, "day");

      return {
         xAxis: {
            type: "time",
            axisLabel: {
               rotate: 45,
               formatter: (value: string | number | Date) => {
                  const date = dayjs(value);
                  return date.format("HH:mm");
               },
            },
            min: oneDayAgo.valueOf(), // 设置 x 轴最小值为 24 小时前
            max: now.valueOf(), // 设置 x 轴最大值为当前时间
         },
         yAxis: {
            type: "value",
            connectNulls: false,
         },
         series: [
            {
               name: seriesName,
               data: data.map((item) => [item.date, item.value]),
               type: "line",
               smooth: false,
               showSymbol: false,
            },
         ],
         tooltip: {
            trigger: "axis",
         },
      };
   };

   return (
      <Card title={<RoomInfo roomName={roomInfo.name} age={roomInfo.age} gender={roomInfo.gender} type='日' />}>
         <Row gutter={16}>
            <Col span={8}>
               <Card title={<div style={{ textAlign: "center" }}>距离</div>}>
                  {" "}
                  {/* Center the nested Card title */}
                  <div style={{ textAlign: "center" }}>
                     {" "}
                     {/* Center the content */}
                     <p>{roomData?.distance} m</p>
                     <ReactECharts option={getLineOptions(dataDistance, "距离")} style={{ height: 250 }} />
                  </div>
               </Card>
            </Col>
            <Col span={8}>
               <Card title={<div style={{ textAlign: "center" }}>心跳</div>}>
                  <div style={{ textAlign: "center" }}>
                     <p>{roomData?.heartRate} 次/分</p>
                     <ReactECharts option={getLineOptions(dataHeartBeat, "心跳")} style={{ height: 250 }} />
                  </div>
               </Card>
            </Col>
            <Col span={8}>
               <Card title={<div style={{ textAlign: "center" }}>呼吸</div>}>
                  <div style={{ textAlign: "center" }}>
                     <p>{roomData?.breathRate} 次/分</p>
                     <ReactECharts option={getLineOptions(dataBreathRate, "呼吸")} style={{ height: 250 }} />
                  </div>
               </Card>
            </Col>
         </Row>
         <RoomInfoFoot
            lastUpdate={roomData?.time ? new Date(roomData?.time).toLocaleString() : ""}
            onDisarmClick={() => {}}
         />
      </Card>
   );
};

export default DailyDataSlide;
