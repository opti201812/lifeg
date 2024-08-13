// components/RoomPage/DailyDataSlide.tsx
import React from "react";
import { Card, Row, Col } from "antd";
import ReactECharts from "echarts-for-react";
import { CurrentData, DataPoint } from "../../types";
import dayjs from "dayjs";
import { RoomInfo } from "./RoomInfo";
import RoomInfoFoot from "./RoomInfoFoot";

interface DailyDataSlideProps {
   roomId: number;
   age: number;
   gender: string;
   currentData: CurrentData;
   filterLast24Hours: (data: DataPoint[]) => DataPoint[];
   getLineOptions: (data: DataPoint[], seriesName: string, isDaily?: boolean) => any;
}

const DailyDataSlide: React.FC<DailyDataSlideProps> = ({
   roomId,
   age,
   gender,
   currentData,
   filterLast24Hours,
   getLineOptions,
}) => {
   return (
      <Card title={<RoomInfo roomId={roomId} age={age} gender={gender} type='日' />}>
         <Row gutter={16}>
            <Col span={8}>
               <Card title='距离'>
                  <p>{currentData.distance} m</p>
                  <ReactECharts
                     option={getLineOptions(filterLast24Hours(currentData.distanceData), "距离")}
                     style={{ height: 250 }}
                  />
               </Card>
            </Col>
            <Col span={8}>
               <Card title='心跳'>
                  <p>{currentData.heartbeat} 次/分</p>
                  <ReactECharts
                     option={getLineOptions(filterLast24Hours(currentData.heartbeatData), "心跳")}
                     style={{ height: 250 }}
                  />
               </Card>
            </Col>
            <Col span={8}>
               <Card title='呼吸'>
                  <p>{currentData.breathing} 次/分</p>
                  <ReactECharts
                     option={getLineOptions(filterLast24Hours(currentData.breathingData), "呼吸")}
                     style={{ height: 250 }}
                  />
               </Card>
            </Col>
         </Row>
         <RoomInfoFoot lastUpdate={currentData.lastUpdate} onDisarmClick={() => {}} />
      </Card>
   );
};

export default DailyDataSlide;
