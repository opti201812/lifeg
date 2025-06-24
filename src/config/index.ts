// src/config/index.ts

const clientIp = window.location.host;

// 报警显示模式类型定义
export type AlarmDisplayMode = "banner" | "table";

const config = {
   backend: {
      ws_url: process.env.REACT_APP_BACKEND_URL?.replace("http", "ws").replace("/api", "") || `ws://${clientIp}`,
      url: process.env.REACT_APP_BACKEND_URL || `http://${clientIp}/api`,
   },
   alarm: {
      // 报警显示模式配置
      // 'banner' - 使用AlarmBanner组件（底部横幅显示）
      // 'table' - 使用实时报警表格（NewOverview中的表格选项卡）
      displayMode: (process.env.REACT_APP_ALARM_DISPLAY_MODE as AlarmDisplayMode) || "table",
   },
};

export default config;
