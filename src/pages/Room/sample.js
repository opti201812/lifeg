function generateDataWithDailyPattern(dateRange) {
   const data = [];
   for (const date of dateRange) {
      const hour = date.getHours();

      // 白天时段 (6:00 - 22:00) 数据波动更大
      if (hour >= 6 && hour < 22) {
         const heartRate = Math.floor(Math.random() * 31) + 65;
         const breathing = Math.floor(Math.random() * 11) + 15;
         const distance = (Math.random() * 1.5 + 1.5).toFixed(1); // 1.5 ~ 3 meters, with one decimal place
         data.push({
            date: date.toISOString().slice(0, 19).replace('T', ' '),
            heartRate,
            breathing,
            distance: parseFloat(distance), // Convert distance to a number
         });
      } else {
         // 晚上时段 (22:00 - 6:00) 数据波动较小, 距离基本保持在 1.5 米左右
         const heartRate = Math.floor(Math.random() * 21) + 50;
         const breathing = Math.floor(Math.random() * 9) + 10;
         const distanceVariation = (Math.random() - 0.5) * 0.2; // Small variation around 1.5
         const distance = (1.5 + distanceVariation).toFixed(1);
         data.push({
            date: date.toISOString().slice(0, 19).replace('T', ' '),
            heartRate,
            breathing,
            distance: parseFloat(distance),
         });
      }
   }
   return data;
}
// 获取当前时间
const now = new Date();

// 计算一周前的时间
const oneWeekAgo = new Date();
oneWeekAgo.setDate(now.getDate() - 7);

// 生成时间范围，每10分钟一个时间点
const dateRange = [];
for (let date = new Date(oneWeekAgo); date <= now; date.setMinutes(date.getMinutes() + 10)) {
   dateRange.push(new Date(date));
}

// 生成心跳和呼吸数据
const generatedData = generateDataWithDailyPattern(dateRange);
const heartbeatData = generatedData.map(item => ({ date: item.date, value: item.heartRate }));
const breathingData = generatedData.map(item => ({ date: item.date, value: item.breathing }));
const distanceData = generatedData.map(item => ({ date: item.date, value: item.distance }));

// 生成最终的 JSON 数据
const finalData = {
   distanceData,
   distance: Math.floor(Math.random() * 11),
   steps: Math.floor(Math.random() * 10001), // 0 ~ 10000
   calories: Math.floor(Math.random() * 3001), // 0 ~ 3000
   sleep: Math.floor(Math.random() * 9), // 0 ~ 8
   heartRate: Math.floor(Math.random() * 41) + 60, // 60 ~ 100
   heartbeat: Math.floor(Math.random() * 41) + 60, // 60 ~ 100
   breathing: Math.floor(Math.random() * 9) + 12, // 12 ~ 20
   heartbeatData,
   breathingData,
   bloodPressureData: 0,
   lastUpdate: now.toISOString().slice(0, 19).replace('T', ' '),
};

export default finalData;
