import React, { useEffect, useState, useMemo } from "react";
import { Table } from "antd";
import mqtt from "mqtt";
import config from "../../config";

interface Alarm {
   time: string;
   level: string;
   message: string;
}

const AlarmDisplay: React.FC = () => {
   const [alarms, setAlarms] = useState<Alarm[]>([]);

   useEffect(() => {
      const client = mqtt.connect(config.mqtt.brokerUrl);

      client.on("connect", () => {
         client.subscribe(config.mqtt.topic);
      });

      client.on("message", (topic, message) => {
         const alarm = JSON.parse(message.toString());
         setAlarms((prevAlarms) => [...prevAlarms, alarm]);
      });

      return () => {
         client.end();
      };
   }, []);

   const columns = useMemo(
      () => [
         { title: "时间", dataIndex: "time", key: "time" },
         { title: "级别", dataIndex: "level", key: "level" },
         { title: "信息", dataIndex: "message", key: "message" },
      ],
      []
   );

   return (
      <div>
         <h2>报警信息</h2>
         <Table dataSource={alarms} columns={columns} rowKey='time' />
      </div>
   );
};

export default React.memo(AlarmDisplay);
