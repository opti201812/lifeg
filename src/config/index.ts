// src/config/index.ts

/**
 * CSM HTTP API 根地址（License 双写用）。
 * 默认基于 hostname + CSM_WEB_API_PORT(3010)；可用 REACT_APP_CSM_HTTP_URL 覆盖，
 * 或由后端 /client-config 返回的 csmHttpUrl 覆盖。
 * 注意：window.location.host 含端口，需先提取 hostname，避免拼出 `host:port:3010` 的错误地址。
 */
const csmHttpBase = (hostWithPort: string) => {
   if (process.env.REACT_APP_CSM_HTTP_URL) return process.env.REACT_APP_CSM_HTTP_URL;
   const host = hostWithPort.split(":")[0];
   return `http://${host}:3010/api/v1`;
};

const clientIp = window.location.host;

export type AlarmDisplayMode = "banner" | "table";

interface Config {
   backend: {
      url: string;
      ws_url: string;
   };
   csm: {
      ws_root_url: string;
      http_url: string;
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
      http_url: csmHttpBase(clientIp),
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
            http_url: serverConfig.csmHttpUrl || csmHttpBase(clientIp),
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
