import React from "react";
import { Table, Tag } from "antd";
import { Room } from "../../types";

// 设备数据接口
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

// Redux报警数据接口
interface ReduxAlarmData {
   personnelId: number;
   roomId: number;
   alarmTime: string;
   devices: AlarmDevices;
   alarm: {
      params: {
         level: number;
         message: string;
      };
   };
   queueTimestamp?: number;
   [key: string]: any;
}

interface AlarmTableProps {
   alarms: ReduxAlarmData[];
   rooms: Room[];
   loading: boolean;
}

const AlarmTable: React.FC<AlarmTableProps> = ({ alarms, rooms, loading }) => {
   // 获取房间名称
   const getRoomNameById = (roomId: number) => {
      const room = rooms.find((r) => r.id === roomId);
      return room ? room.name : `未知房间(${roomId})`;
   };

   // 获取报警级别文本（与AlarmBanner保持一致）
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

   // 从设备数据中提取信息
   const getDeviceData = (devices: AlarmDevices) => {
      // 优先使用手环数据
      const braceletHeartRate = devices.bracelet?.heartRate;

      // 处理雷达数据（过滤掉0值，优先使用第一个有效数据）
      const validRadars = devices.radar?.filter((r) => (r.heartRate || 0) > 0) || [];
      const primaryRadar = validRadars[0] || devices.radar?.[0];

      return {
         heartRate: braceletHeartRate ?? primaryRadar?.heartRate ?? null,
         breathRate: primaryRadar?.breathRate ?? null,
         distance: primaryRadar?.distance ?? null,
         pose: primaryRadar?.pose ?? null,
         environment: primaryRadar?.environment ?? null,
      };
   };

   // 处理报警数据，按时间排序（新到旧）
   const processedAlarms = React.useMemo(() => {
      return [...alarms]
         .sort((a, b) => new Date(b.alarmTime).getTime() - new Date(a.alarmTime).getTime())
         .map((alarm, index) => {
            const deviceData = getDeviceData(alarm.devices);
            return {
               key: `${alarm.personnelId || index}-${alarm.alarmTime}`,
               alarmTime: alarm.alarmTime,
               level: alarm.alarm.params.level,
               message: alarm.alarm.params.message,
               roomId: alarm.roomId,
               roomName: getRoomNameById(alarm.roomId),
               personnelId: alarm.personnelId,
               ...deviceData,
            };
         });
   }, [alarms, rooms]);

   // 表格列定义
   const columns = [
      {
         title: "报警时间",
         dataIndex: "alarmTime",
         key: "alarmTime",
         width: 200,
         render: (time: string) => {
            const date = new Date(time);
            return (
               date.toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
               }) +
               " " +
               date.toLocaleTimeString("zh-CN", {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
               })
            );
         },
         sorter: (a: any, b: any) => new Date(b.alarmTime).getTime() - new Date(a.alarmTime).getTime(),
         defaultSortOrder: "ascend" as const,
      },
      {
         title: "报警级别",
         dataIndex: "level",
         key: "level",
         width: 100,
         render: (level: number) => {
            const levelText = getAlarmLevelText(level);
            const colors = ["red", "orange", "blue", "green"];
            return <Tag color={colors[level - 1] || "default"}>{levelText || `级别${level}`}</Tag>;
         },
      },
      {
         title: "房间",
         dataIndex: "roomName",
         key: "roomName",
         width: 120,
      },
      {
         title: "报警信息",
         dataIndex: "message",
         key: "message",
         ellipsis: true,
      },
      {
         title: "心率",
         dataIndex: "heartRate",
         key: "heartRate",
         width: 100,
         render: (value: any) => (value ? `${value} 次/分` : "-"),
      },
      {
         title: "呼吸率",
         dataIndex: "breathRate",
         key: "breathRate",
         width: 100,
         render: (value: any) => (value ? `${value} 次/分` : "-"),
      },
      {
         title: "距离",
         dataIndex: "distance",
         key: "distance",
         width: 100,
         render: (value: any) => (value ? `${(value / 100).toFixed(2)}m` : "-"),
      },
   ];

   return (
      <Table
         columns={columns}
         dataSource={processedAlarms}
         loading={loading}
         pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条报警`,
         }}
         size='middle'
      />
   );
};

export default React.memo(AlarmTable);
