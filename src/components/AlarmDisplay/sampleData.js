const sampleAlarmData = [
    {
        personnelId: 1,
        name: "张三",
        heartRate: 98, // Slightly elevated heart rate
        breathRate: 16,
        distance: 2.1,
        alarmLevel: "low",
        handlingMethod: "观察",
        handlingTime: "2024-08-04 15:30:00",
        dateTime: "2024-08-04 15:00:00",
    },
    {
        personnelId: 1,
        name: "张三",
        heartRate: 105, // High heart rate
        breathRate: 22,
        distance: 2.8,
        alarmLevel: "medium",
        handlingMethod: "通知医护人员",
        handlingTime: "2024-08-03 11:15:00",
        dateTime: "2024-08-03 11:00:00",
    },
    {
        personnelId: 1,
        name: "张三",
        heartRate: 55, // Low heart rate
        breathRate: 10,
        distance: 1.3,
        alarmLevel: "low",
        handlingMethod: "观察",
        handlingTime: "2024-08-01 09:45:00",
        dateTime: "2024-08-01 09:30:00",
    },
    {
        personnelId: 1,
        name: "张三",
        heartRate: 75,
        breathRate: 19,
        distance: 2.0,
        alarmLevel: "none", // No alarm
        handlingMethod: "",
        handlingTime: "2024-08-04 15:30:00",
        dateTime: "2024-07-29 16:20:00",
    },
    // ... add 6 more data points for personnelId 1

    {
        personnelId: 2,
        name: "李四",
        heartRate: 70,
        breathRate: 30, // High breath rate
        distance: 2.5,
        alarmLevel: "medium",
        handlingMethod: "调整呼吸",
        handlingTime: "2024-08-05 20:00:00",
        dateTime: "2024-08-05 19:30:00",
    },
    {
        personnelId: 2,
        name: "李四",
        heartRate: 110, // Very high heart rate
        breathRate: 25,
        distance: 1.1,
        alarmLevel: "high",
        handlingMethod: "紧急呼叫",
        handlingTime: "2024-08-03 02:45:00",
        dateTime: "2024-08-03 02:30:00",
    },
    {
        personnelId: 2,
        name: "李四",
        heartRate: 60,
        breathRate: 14,
        distance: 1.9,
        alarmLevel: "none",
        handlingMethod: "",
        handlingTime: "2024-08-04 15:30:00",
        dateTime: "2024-07-30 10:00:00",
    },
    // ... add 7 more data points for personnelId 2
];

export default sampleAlarmData;
