// config/index.ts

const config = {
   mqtt: {
      brokerUrl: "ws://your-mqtt-broker-url:port",
      topic: "alarm/topic",
   },
   backend: {
      url: "http://localhost:3030/api",
   },
};

export default config;
