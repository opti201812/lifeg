// components/RoomPage/WeeklyDataSlide.tsx

import React, { useEffect } from "react";
import { Card, Row, Col, message } from "antd";
import ReactECharts from "echarts-for-react";
import { DataPoint } from "../../types";
import dayjs from "dayjs";
import { RoomInfo } from "./RoomInfo";
import RoomInfoFoot from "./RoomInfoFoot";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import axios from "axios";
import config from "../../config";
import { normalizeRadarDistanceToMeters } from "../../shared/src/utils/radarDistance";

interface WeeklyDataSlideProps {
   roomInfo: { name: string; age: number; gender: string; roomId: number; personnelId?: number | null };
   roomId: number;
   isActive: boolean;
}

const WeeklyDataSlide: React.FC<WeeklyDataSlideProps> = ({ roomInfo, isActive }) => {
   const [dataDistance, setDataDistance] = React.useState<DataPoint[]>([]);
   const [dataHeartBeat, setDataHeartBeat] = React.useState<DataPoint[]>([]);
   const [dataBreathRate, setDataBreathRate] = React.useState<DataPoint[]>([]);
   const [dataEnvironment, setDataEnvironment] = React.useState<DataPoint[]>([]);
   const roomData = useSelector((state: RootState) => state.data.rooms.find((room) => room.id === roomInfo.roomId)); // Get room data from Redux store
   const sevenDaysAgo = dayjs().subtract(7, "day").format("YYYY-MM-DD HH:mm:ss");

   useEffect(() => {
      if (!isActive) {
         return;
      }
      const fetchHistoricalData = async () => {
         if (!roomInfo?.personnelId) {
            console.log("No personnelId found for this room.");
            return;
         }

         try {
            const queryParams = new URLSearchParams({
               personnelId: roomInfo.personnelId.toString(),
               startDate: sevenDaysAgo,
               endDate: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            });

            const response = await axios.get(`${config.backend.url}/history?${queryParams.toString()}`, {
               headers: {
                  "Cache-Control": "no-cache",
               },
            });
            response.data.sort((a: any, b: any) => {
               const dateA = new Date(a.time);
               const dateB = new Date(b.time);
               return dateA.getTime() - dateB.getTime();
            });

            setDataDistance(
               response.data.map((item: any) => ({
                  date: new Date(item.time).getTime(),
                  // 兼容新旧后端数据：>5 按厘米，≤5 按米
                  value: normalizeRadarDistanceToMeters(item.distance),
               }))
            );
            setDataHeartBeat(
               response.data.map((item: any) => ({
                  date: new Date(item.time).getTime(),
                  value: item.bracelet_heart_rate || item.radar_heart_rate || item.below60_heart_rate_count,
               }))
            );
            setDataBreathRate(
               response.data.map((item: any) => ({ date: new Date(item.time).getTime(), value: item.breath_rate }))
            );
            setDataEnvironment(
               response.data.map((item: any) => ({
                  date: new Date(item.time).getTime(),
                  value: item.environment_interference,
               }))
            );
            console.log("Refreshed weekly data");
         } catch (error) {
            console.error("Error fetching historical data:", error);
            message.error("获取历史数据失败！");
         }
      };

      fetchHistoricalData();
      const intervalId = setInterval(fetchHistoricalData, 30 * 1000); // 60 seconds * 1000 milliseconds

      return () => clearInterval(intervalId);
   }, [roomInfo.roomId, roomInfo.personnelId, isActive]); // Re-fetch when roomId changes

   const getLineOptions = (data: DataPoint[], seriesName: string) => {
      return {
         xAxis: {
            type: "time",
            axisLabel: {
               rotate: 45,
               formatter: (value: string | number | Date) => {
                  const date = dayjs(value);
                  return date.format("MM/DD HH:mm");
               },
            },
         },
         yAxis: {
            type: "value",
            connectNulls: false,
         },
         series: [
            {
               name: seriesName,
               data: data.map((item) => [item.date, item.value]),
               type: "scatter",
               symbolSize: 3,
               smooth: false,
               showSymbol: false,
               connectNulls: false,
            },
         ],
         tooltip: {
            trigger: "axis",
         },
      };
   };

   return (
      <Card
         title={
            <RoomInfo roomName={roomInfo.name} age={roomInfo.age} gender={roomInfo.gender} room={roomData} type='周' />
         }
         style={{ height: 600 }}
      >
         <Row gutter={16}>
            <Col span={6}>
               <Card title={<div style={{ textAlign: "center" }}>距离</div>}>
                  <div style={{ textAlign: "center" }}>
                     <p>{roomData?.distance} m</p>
                     <ReactECharts option={getLineOptions(dataDistance, "距离")} style={{ height: 250 }} />
                  </div>
               </Card>
            </Col>
            <Col span={6}>
               <Card title={<div style={{ textAlign: "center" }}>心跳</div>}>
                  <div style={{ textAlign: "center" }}>
                     <p>{roomData?.heartRate} 次/分</p>
                     <ReactECharts option={getLineOptions(dataHeartBeat, "心跳")} style={{ height: 250 }} />
                  </div>
               </Card>
            </Col>
            <Col span={6}>
               <Card title={<div style={{ textAlign: "center" }}>呼吸</div>}>
                  <div style={{ textAlign: "center" }}>
                     <p>{roomData?.breathRate} 次/分</p>
                     <ReactECharts option={getLineOptions(dataBreathRate, "呼吸")} style={{ height: 250 }} />
                  </div>
               </Card>
            </Col>
            <Col span={6}>
               <Card title={<div style={{ textAlign: "center" }}>环境干扰</div>}>
                  <div style={{ textAlign: "center" }}>
                     <p>{roomData?.environment || "-"}</p>
                     <ReactECharts option={getLineOptions(dataEnvironment, "环境干扰")} style={{ height: 250 }} />
                  </div>
               </Card>
            </Col>
         </Row>
         <RoomInfoFoot
            lastUpdate={roomData?.time ? new Date(roomData?.time).toLocaleString() : ""}
            pose={roomData?.person_pose || ""}
         />
      </Card>
   );
};

export default WeeklyDataSlide;
