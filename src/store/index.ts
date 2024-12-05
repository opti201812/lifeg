// store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import dataReducer from "./dataSlice"; // Import the data reducer

const store = configureStore({
   reducer: {
      user: userReducer,
      data: dataReducer, // Add the data reducer to the store
   },
});

// 定时器检查报警是否过期
setInterval(() => {
   const currentTime = Date.now();
   const alarmExpirationTime = 5 * 60 * 1000; // 5 minutes in milliseconds

   const { data } = store.getState();

   const expiredAlarms = data.alarms.filter(
      (alarm) => currentTime - (alarm.createTimeStamp || Date.now()) > alarmExpirationTime
   );

   if (expiredAlarms.length > 0) {
      expiredAlarms.forEach((expiredAlarm) => {
         // 移除过期的报警
         store.dispatch({ type: "data/removeAlarm", payload: expiredAlarm.id });
         console.log("已取消显示过期的报警：", expiredAlarm);
      });
   }
}, 60 * 1000); // 每分钟检查一次

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
