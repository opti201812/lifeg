// src/config/index.ts

const clientIp = window.location.host;

const config = {
   backend: {
      ws_url: process.env.REACT_APP_BACKEND_URL?.replace("http", "ws").replace("/api", "") || `ws://${clientIp}`,
      url: process.env.REACT_APP_BACKEND_URL || `http://${clientIp}/api`,
   },
};

export default config;
