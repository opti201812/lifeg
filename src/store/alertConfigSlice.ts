// store/alertConfigSlice.ts

import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import config from "../config";
import { AlertConfig } from "../types"; // Import types

interface AlertConfigState {
   data: { [key: string]: any } | null;
   loading: boolean;
   error: string | null;
}

const initialState: AlertConfigState = {
   data: null,
   loading: false,
   error: null,
};

// 创建异步 thunk，用于获取报警配置
export const fetchAlertConfig = createAsyncThunk("alertConfig/fetchAlertConfig", async (_, thunkAPI) => {
   try {
      const response = await axios.get(`${config.backend.url}/alertconfig`);
      // 转换数据格式为普通的 JSON 键值对
      const configData = response.data.reduce((acc: { [key: string]: any }, item: AlertConfig) => {
         acc[item.config_name] = item.value;
         return acc;
      }, {});
      return configData;
   } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
   }
});

const alertConfigSlice = createSlice({
   name: "alertConfig",
   initialState,
   reducers: {
      updateLicenseInfo(state, action: PayloadAction<{ licenseType: string; expiryDate: string }>) {
         state.data = {
            ...state.data,
            licenseType: action.payload.licenseType,
            expiryDate: action.payload.expiryDate,
         };
      },
   },
   extraReducers: (builder) => {
      builder
         .addCase(fetchAlertConfig.pending, (state) => {
            state.loading = true;
            state.error = null;
         })
         .addCase(fetchAlertConfig.fulfilled, (state, action: PayloadAction<{ [key: string]: any }>) => {
            state.loading = false;
            state.data = action.payload;
         })
         .addCase(fetchAlertConfig.rejected, (state, action: PayloadAction<any>) => {
            state.loading = false;
            state.error = action.payload;
         });
   },
});
export const { updateLicenseInfo } = alertConfigSlice.actions;

export default alertConfigSlice.reducer;
