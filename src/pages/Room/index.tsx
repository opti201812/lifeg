import React, { useState, useEffect, useRef } from "react";
import { Carousel, Card, Row, Col, message } from "antd";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import currentData from "./sample.js";
import { Tag, Typography } from "antd";
import DailyDataSlide from "./DailyDataSlide";
import WeeklyDataSlide from "./WeeklyDataSlide";
import MonitoringControlSlide from "./MonitoringControlSlide";
import axios from "axios";
import config from "../../config/index";
import { DataPoint } from "../../types.js";

interface User {
   id: number;
   name: string;
   gender: string;
   age: number;
   role: "user" | "admin";
}

// Define Props interface for clarity
interface PropsWithRoomId {
   roomId: number;
   age: number;
   gender: string;
}

const RoomPage: React.FC<PropsWithRoomId> = ({ roomId }) => {
   const user = useSelector((state: { user: User }) => state.user);
   const [data, setData] = useState([
      {
         weeklyData: [
            { date: "2024-06-10", value: 120, type: "distance" },
            { date: "2024-06-11", value: 130, type: "heartbeat" },
            { date: "2024-06-12", value: 110, type: "breathing" },
            // 更多数据...
         ],
         currentData: currentData,
         date: "2024-07-01 10:00:00",
      },
   ]);

   const [isMonitoringEnabled, setIsMonitoringEnabled] = useState(false); // Track monitoring status

   useEffect(() => {
      // Fetch initial monitoring status
      const fetchRoomStatus = async () => {
         try {
            setIsMonitoringEnabled(true);
            const response = await axios.get(`${config.backend.url}/rooms/${roomId}`);
            // setIsMonitoringEnabled(response.data.enabled);
         } catch (error) {
            console.error("Error fetching room status:", error);
            // message.error("Failed to load room status");
         }
      };

      fetchRoomStatus();
   }, [roomId]);

   const handleMonitoringStatusChange = (enabled: boolean) => {
      setIsMonitoringEnabled(enabled);
   };

   const lineConfig = {
      data,
      xField: "date",
      yField: "value",
      seriesField: "type",
      smooth: true,
      height: 300,
   };

   const getLineOptions = (data: DataPoint[], seriesName: string, isDaily = true) => ({
      xAxis: {
         type: "time",
         axisLabel: {
            rotate: 45,
         },
         splitNumber: isDaily ? 7 : 7,
      },
      yAxis: {
         type: "value",
      },
      series: [
         {
            name: seriesName,
            data: data.map((item) => [item.date, item.value]),
            type: "line",
            smooth: true,
            showSymbol: false,
         },
      ],
      tooltip: {
         trigger: "axis",
      },
   });

   function filterLast24Hours(data: { date: string; value: number }[]) {
      const oneDayAgo = dayjs().subtract(1, "day");
      return data.filter((item) => dayjs(item.date) > oneDayAgo);
   }

   return (
      <div
         style={{
            margin: "0 auto",
            maxWidth: "1000px",
            width: "100%",
            height: "100%",
         }}
      >
         <Carousel autoplay={isMonitoringEnabled}>
            {" "}
            {/* Autoplay only when monitoring is enabled */}
            <MonitoringControlSlide
               roomId={roomId}
               isMonitoringEnabled={isMonitoringEnabled}
               setIsMonitoringEnabled={setIsMonitoringEnabled}
               onMonitoringStatusChange={handleMonitoringStatusChange}
            />
            <DailyDataSlide
               roomId={roomId}
               age={user.age}
               gender={user.gender}
               currentData={currentData}
               filterLast24Hours={filterLast24Hours}
               getLineOptions={getLineOptions}
            />
            <WeeklyDataSlide
               roomId={roomId}
               age={user.age}
               gender={user.gender}
               currentData={currentData}
               getLineOptions={getLineOptions}
            />
         </Carousel>
      </div>
   );
};

export default RoomPage;
