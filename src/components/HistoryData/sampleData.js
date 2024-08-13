const sampleData = [
    {
        personnelId: 1,
        name: "张三",
        heartRate: 72,
        breathRate: 18,
        distance: 2.5,
        isAlarm: false,
        dateTime: "2024-08-05 10:30:00", // Within the last week
    },
    {
        personnelId: 1,
        name: "张三",
        heartRate: 78,
        breathRate: 20,
        distance: 1.8,
        isAlarm: false,
        dateTime: "2024-08-05 14:45:00",
    },
    {
        personnelId: 1,
        name: "张三",
        heartRate: 65,
        breathRate: 12,
        distance: 1.6,
        isAlarm: false,
        dateTime: "2024-08-03 03:20:00",
    },
    {
        personnelId: 1,
        name: "张三",
        heartRate: 95,
        breathRate: 24,
        distance: 3.0,
        isAlarm: true, // Example of an alarm
        dateTime: "2024-07-31 18:00:00",
    },
    // ... add more data points for personnelId 1

    {
        personnelId: 2,
        name: "李四",
        heartRate: 80,
        breathRate: 16,
        distance: 2.2,
        isAlarm: false,
        dateTime: "2024-08-06 08:15:00",
    },
    {
        personnelId: 2,
        name: "李四",
        heartRate: 62,
        breathRate: 10,
        distance: 1.4,
        isAlarm: false,
        dateTime: "2024-08-04 23:50:00",
    },
    {
        personnelId: 2,
        name: "李四",
        heartRate: 105,
        breathRate: 28,
        distance: 2.7,
        isAlarm: true,
        dateTime: "2024-08-02 12:30:00",
    },
    // ... add more data points for personnelId 2
];

export default sampleData;
