// src/config/index.ts

const clientIp = window.location.host;

export type AlarmDisplayMode = "banner" | "table";

interface Config {
   backend: {
      url: string;
      ws_url: string;
   };
   csm: {
      ws_root_url: string;
      radar_full_url: string;
      bracelet_url: string;
      oximeter_url: string;
   };
   alarm: {
      displayMode: AlarmDisplayMode;
   };
}

let config: Config = {
   backend: {
      url: process.env.REACT_APP_BACKEND_URL || `http://${clientIp}/api`,
      ws_url: process.env.REACT_APP_BACKEND_URL?.replace("http", "ws").replace("/api", "") || `ws://${clientIp}`,
   },
   csm: {
      ws_root_url: process.env.REACT_APP_CSM_WS_URL || `ws://${clientIp}`,
      radar_full_url: (process.env.REACT_APP_CSM_WS_URL || `ws://${clientIp}`) + "/radar-full",
      bracelet_url: (process.env.REACT_APP_CSM_WS_URL || `ws://${clientIp}`) + "/bracelet",
      oximeter_url: (process.env.REACT_APP_CSM_WS_URL || `ws://${clientIp}`) + "/oximeter",
   },
   alarm: {
      displayMode: (process.env.REACT_APP_ALARM_DISPLAY_MODE as AlarmDisplayMode) || "table",
   },
};

export const loadConfig = async (): Promise<Config> => {
   try {
      const response = await fetch(`${config.backend.url}/client-config`);
      const serverConfig = await response.json();

      const wsRoot = serverConfig.csmWebSocketUrl;

      config = {
         ...config,
         backend: {
            url: serverConfig.backendUrl,
            ws_url: serverConfig.backendUrl.replace("http", "ws").replace("/api", ""),
         },
         csm: {
            ws_root_url: wsRoot,
            radar_full_url: wsRoot + "/radar-full",
            bracelet_url: wsRoot + "/bracelet",
            oximeter_url: wsRoot + "/oximeter",
         },
      };
   } catch (error) {
      console.warn("[配置] 从服务器加载失败，使用默认值:", error);
   }
   return config;
};

export const getConfig = (): Config => config;

export default config;
