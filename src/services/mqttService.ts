import mqtt from "mqtt";
import config from "../config";

const client = mqtt.connect(config.mqtt.brokerUrl);

client.on("connect", () => {
   console.log("Connected to MQTT broker");
});

client.on("error", (err) => {
   console.error("Connection error: ", err);
   client.end();
});

export const subscribeToTopic = (topic: string, callback: (message: any) => void) => {
   client.subscribe(topic, (err) => {
      if (!err) {
         client.on("message", (receivedTopic, message) => {
            if (receivedTopic === topic) {
               callback(JSON.parse(message.toString()));
            }
         });
      }
   });
};

export const publishMessage = (topic: string, message: any) => {
   client.publish(topic, JSON.stringify(message));
};
