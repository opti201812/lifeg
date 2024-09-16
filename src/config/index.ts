const config = {
   mqtt: {
      brokerUrl: "ws://your-mqtt-broker-url:port",
      topic: "alarm/topic",
   },
   backend: {
      ws_url: process.env.REACT_APP_BACKEND_URL?.replace("http", "ws").replace("/api", "") || "ws://localhost:3030", // 从 REACT_APP_BACKEND_URL 转换
      url: process.env.REACT_APP_BACKEND_URL || "http://localhost:3030/api", // 如果环境变量不存在，使用默认值
   },
};

export default config;
