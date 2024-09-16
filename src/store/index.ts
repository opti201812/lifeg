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

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
