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

interface WeeklyDataSlideProps {
   roomInfo: { name: string; age: number; gender: string; roomId: number; personnelId?: number | null };
   roomId: number;
   isActive: boolean;
}

const WeeklyDataSlide: React.FC<WeeklyDataSlideProps> = ({ roomInfo, isActive }) => {
   const [dataHeartBeat, setDataHeartBeat] = React.useState<DataPoint[]>([]);
   const [dataBreathRate, setDataBreathRate] = React.useState<DataPoint[]>([]);
   const [dataSystolicPressure, setDataSystolicPressure] = React.useState<DataPoint[]>([]);
   const [dataDiastolicPressure, setDataDiastolicPressure] = React.useState<DataPoint[]>([]);
   const [dataBloodOxygen, setDataBloodOxygen] = React.useState<DataPoint[]>([]);
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

            setDataHeartBeat(
               response.data.map((item: any) => ({
                  date: new Date(item.time).getTime(),
                  value: item.bracelet_heart_rate || item.radar_heart_rate || item.below60_heart_rate_count,
               }))
            );
            setDataBreathRate(
               response.data.map((item: any) => ({ date: new Date(item.time).getTime(), value: item.breath_rate }))
            );
            setDataSystolicPressure(
               response.data.map((item: any) => ({
                  date: new Date(item.time).getTime(),
                  value: item.bracelet_systolic_pressure,
               }))
            );
            setDataDiastolicPressure(
               response.data.map((item: any) => ({
                  date: new Date(item.time).getTime(),
                  value: item.bracelet_diastolic_pressure,
               }))
            );
            setDataBloodOxygen(
               response.data.map((item: any) => ({
                  date: new Date(item.time).getTime(),
                  value: item.bracelet_blood_oxygen,
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

   const getBloodPressureOptions = (systolicData: DataPoint[], diastolicData: DataPoint[]) => {
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
               name: "收缩压",
               data: systolicData.map((item) => [item.date, item.value]),
               type: "scatter",
               symbolSize: 3,
               smooth: false,
               showSymbol: false,
               connectNulls: false,
               lineStyle: { color: "#ff4d4f" },
            },
            {
               name: "舒张压",
               data: diastolicData.map((item) => [item.date, item.value]),
               type: "scatter",
               symbolSize: 3,
               smooth: false,
               showSymbol: false,
               connectNulls: false,
               lineStyle: { color: "#1890ff" },
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
         style={{ height: 900 }}
      >
         <Row gutter={16}>
            <Col span={12}>
               <Card title={<div style={{ textAlign: "center" }}>心率</div>}>
                  <div style={{ textAlign: "center" }}>
                     <p>{roomData?.heartRate} 次/分</p>
                     <ReactECharts option={getLineOptions(dataHeartBeat, "心率")} style={{ height: 250 }} />
                  </div>
               </Card>
            </Col>
            <Col span={12}>
               <Card title={<div style={{ textAlign: "center" }}>呼吸</div>}>
                  <div style={{ textAlign: "center" }}>
                     <p>{roomData?.breathRate} 次/分</p>
                     <ReactECharts option={getLineOptions(dataBreathRate, "呼吸")} style={{ height: 250 }} />
                  </div>
               </Card>
            </Col>
         </Row>
         <Row gutter={16}>
            <Col span={12}>
               <Card title={<div style={{ textAlign: "center" }}>血压</div>}>
                  <div style={{ textAlign: "center" }}>
                     <p>
                        {(roomData as any)?.braceletData?.systolicPressure &&
                        (roomData as any)?.braceletData?.diastolicPressure
                           ? `${(roomData as any).braceletData.diastolicPressure}/${
                                (roomData as any).braceletData.systolicPressure
                             }`
                           : "-"}{" "}
                        mmHg
                     </p>
                     <ReactECharts
                        option={getBloodPressureOptions(dataSystolicPressure, dataDiastolicPressure)}
                        style={{ height: 250 }}
                     />
                  </div>
               </Card>
            </Col>
            <Col span={12}>
               <Card title={<div style={{ textAlign: "center" }}>血氧</div>}>
                  <div style={{ textAlign: "center" }}>
                     <p>{(roomData as any)?.braceletData?.bloodOxygen || "-"} %</p>
                     <ReactECharts option={getLineOptions(dataBloodOxygen, "血氧")} style={{ height: 250 }} />
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
