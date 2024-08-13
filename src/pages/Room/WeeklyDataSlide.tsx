// components/RoomPage/WeeklyDataSlide.tsx
import React from "react";
import { Card, Row, Col } from "antd";
import ReactECharts from "echarts-for-react";
import { CurrentData, DataPoint } from "../../types";
import dayjs from "dayjs";
import { RoomInfo } from "./RoomInfo";
import RoomInfoFoot from "./RoomInfoFoot";

interface WeeklyDataSlideProps {
   roomId: number;
   age: number;
   gender: string;
   currentData: CurrentData;
   getLineOptions: (data: DataPoint[], seriesName: string, isDaily?: boolean) => any;
}

const WeeklyDataSlide: React.FC<WeeklyDataSlideProps> = ({ roomId, age, gender, currentData, getLineOptions }) => {
   return (
      <Card title={<RoomInfo roomId={roomId} age={age} gender={gender} type='周' />}>
         <Row gutter={16}>
            <Col span={8}>
               <Card title='距离'>
                  <p>{currentData.distance} m</p>
                  <ReactECharts
                     option={getLineOptions(currentData.distanceData, "距离", false)}
                     style={{ height: 250 }}
                  />
               </Card>
            </Col>
            <Col span={8}>
               <Card title='心跳'>
                  <p>{currentData.heartbeat} 次/分</p>
                  <ReactECharts
                     option={getLineOptions(currentData.heartbeatData, "心跳", false)}
                     style={{ height: 250 }}
                  />
               </Card>
            </Col>
            <Col span={8}>
               <Card title='呼吸'>
                  <p>{currentData.breathing} 次/分</p>
                  <ReactECharts
                     option={getLineOptions(currentData.breathingData, "呼吸", false)}
                     style={{ height: 250 }}
                  />
               </Card>
            </Col>
         </Row>
         <RoomInfoFoot lastUpdate={currentData.lastUpdate} onDisarmClick={() => {}} />
      </Card>
   );
};

export default WeeklyDataSlide;
