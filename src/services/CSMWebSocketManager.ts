import { getConfig } from "../config";

export interface BraceletData {
   deviceId: string;
   heartRate?: number;
   spo2?: number;
   bloodOxygen?: number;
   systolicPressure?: number;
   diastolicPressure?: number;
   bodyTemperature?: number;
   breathRate?: number;
   batteryVoltage?: number;
   buttonStatus?: number;
   timestamp: number;
}

export interface OximeterData {
   deviceId: string;
   heartRate?: number;
   spo2?: number;
   signalQuality?: number;
   breathRate?: number;
   timestamp: number;
}

export interface RadarData {
   deviceId: string;
   distance?: number;
   heartRate?: number;
   breathRate?: number;
   environmentInterference?: number;
   timestamp: number;
}

interface DeviceCallbacks {
   onBraceletData?: (data: BraceletData) => void;
   onOximeterData?: (data: OximeterData) => void;
   onRadarData?: (data: RadarData) => void;
   onConnected?: () => void;
   onDisconnected?: () => void;
   onError?: (error: Event) => void;
}

class CSMWebSocketManager {
   private wsRadar: WebSocket | null = null;
   private wsBracelet: WebSocket | null = null;
   private wsOximeter: WebSocket | null = null;

   private isRadarConnected: boolean = false;
   private isBraceletConnected: boolean = false;
   private isOximeterConnected: boolean = false;

   private callbacks: DeviceCallbacks = {};
   private reconnectTimeoutRadar: NodeJS.Timeout | null = null;
   private reconnectTimeoutBracelet: NodeJS.Timeout | null = null;
   private reconnectTimeoutOximeter: NodeJS.Timeout | null = null;

   private subscribedRadarDevices: Set<string> = new Set();
   private subscribedBraceletDevices: Set<string> = new Set();
   private subscribedOximeterDevices: Set<string> = new Set();

   private reconnectAttempts: number = 0;
   private maxReconnectAttempts: number = 5;
   private baseReconnectDelay: number = 1000;

   public setCallbacks(callbacks: DeviceCallbacks): void {
      this.callbacks = callbacks;
   }

   private getWsUrl(deviceType: "radar" | "bracelet" | "oximeter"): string {
      const config = getConfig();
      switch (deviceType) {
         case "radar":
            return config.csm.radar_full_url;
         case "bracelet":
            return config.csm.bracelet_url;
         case "oximeter":
            return config.csm.oximeter_url;
      }
   }

   public async connectOximeter(): Promise<boolean> {
      if (this.isOximeterConnected) {
         return true;
      }

      const wsUrl = this.getWsUrl("oximeter");
      console.log("[CSM WS] 正在连接到血氧仪通道:", wsUrl);

      return new Promise((resolve) => {
         try {
            this.wsOximeter = new WebSocket(wsUrl);

            this.wsOximeter.onopen = () => {
               console.log("[CSM WS] 血氧仪通道连接已打开");
               this.isOximeterConnected = true;
               this.callbacks.onConnected?.();
               this.resubscribeOximeterDevices();
               resolve(true);
            };

            this.wsOximeter.onmessage = (event) => {
               try {
                  const message = JSON.parse(event.data);
                  this.handleOximeterMessage(message);
               } catch (error) {
                  console.error("[CSM WS] 解析血氧仪消息失败:", error);
               }
            };

            this.wsOximeter.onclose = () => {
               console.log("[CSM WS] 血氧仪通道连接已关闭");
               this.isOximeterConnected = false;
               this.callbacks.onDisconnected?.();
               this.scheduleReconnect("oximeter");
            };

            this.wsOximeter.onerror = (error) => {
               console.error("[CSM WS] 血氧仪通道连接错误:", error);
               this.callbacks.onError?.(error);
               resolve(false);
            };
         } catch (error) {
            console.error("[CSM WS] 血氧仪连接失败:", error);
            resolve(false);
         }
      });
   }

   public async connectBracelet(): Promise<boolean> {
      if (this.isBraceletConnected) {
         return true;
      }

      const wsUrl = this.getWsUrl("bracelet");
      console.log("[CSM WS] 正在连接到手环通道:", wsUrl);

      return new Promise((resolve) => {
         try {
            this.wsBracelet = new WebSocket(wsUrl);

            this.wsBracelet.onopen = () => {
               console.log("[CSM WS] 手环通道连接已打开");
               this.isBraceletConnected = true;
               this.callbacks.onConnected?.();
               this.resubscribeBraceletDevices();
               resolve(true);
            };

            this.wsBracelet.onmessage = (event) => {
               try {
                  const message = JSON.parse(event.data);
                  this.handleBraceletMessage(message);
               } catch (error) {
                  console.error("[CSM WS] 解析手环消息失败:", error);
               }
            };

            this.wsBracelet.onclose = () => {
               console.log("[CSM WS] 手环通道连接已关闭");
               this.isBraceletConnected = false;
               this.callbacks.onDisconnected?.();
               this.scheduleReconnect("bracelet");
            };

            this.wsBracelet.onerror = (error) => {
               console.error("[CSM WS] 手环通道连接错误:", error);
               this.callbacks.onError?.(error);
               resolve(false);
            };
         } catch (error) {
            console.error("[CSM WS] 手环连接失败:", error);
            resolve(false);
         }
      });
   }

   public async connectRadar(): Promise<boolean> {
      if (this.isRadarConnected) {
         return true;
      }

      const wsUrl = this.getWsUrl("radar");
      console.log("[CSM WS] 正在连接到雷达通道:", wsUrl);

      return new Promise((resolve) => {
         try {
            this.wsRadar = new WebSocket(wsUrl);

            this.wsRadar.onopen = () => {
               console.log("[CSM WS] 雷达通道连接已打开");
               this.isRadarConnected = true;
               this.callbacks.onConnected?.();
               this.resubscribeRadarDevices();
               resolve(true);
            };

            this.wsRadar.onmessage = (event) => {
               try {
                  const message = JSON.parse(event.data);
                  this.handleRadarMessage(message);
               } catch (error) {
                  console.error("[CSM WS] 解析雷达消息失败:", error);
               }
            };

            this.wsRadar.onclose = () => {
               console.log("[CSM WS] 雷达通道连接已关闭");
               this.isRadarConnected = false;
               this.callbacks.onDisconnected?.();
               this.scheduleReconnect("radar");
            };

            this.wsRadar.onerror = (error) => {
               console.error("[CSM WS] 雷达通道连接错误:", error);
               this.callbacks.onError?.(error);
               resolve(false);
            };
         } catch (error) {
            console.error("[CSM WS] 雷达连接失败:", error);
            resolve(false);
         }
      });
   }

   public disconnect(): void {
      this.clearReconnectTimeout("radar");
      this.clearReconnectTimeout("bracelet");
      this.clearReconnectTimeout("oximeter");
      this.reconnectAttempts = 0;

      if (this.wsRadar) {
         this.wsRadar.close();
         this.wsRadar = null;
      }
      if (this.wsBracelet) {
         this.wsBracelet.close();
         this.wsBracelet = null;
      }
      if (this.wsOximeter) {
         this.wsOximeter.close();
         this.wsOximeter = null;
      }

      this.isRadarConnected = false;
      this.isBraceletConnected = false;
      this.isOximeterConnected = false;
      this.subscribedRadarDevices.clear();
      this.subscribedBraceletDevices.clear();
      this.subscribedOximeterDevices.clear();
   }

   public subscribeDevice(deviceId: string, deviceType: "bracelet" | "oximeter" | "radar"): void {
      if (!deviceId) return;

      switch (deviceType) {
         case "radar":
            this.subscribedRadarDevices.add(deviceId);
            if (this.isRadarConnected) {
               this.sendSubscribeRadar(deviceId);
            }
            break;
         case "bracelet":
            this.subscribedBraceletDevices.add(deviceId);
            if (this.isBraceletConnected) {
               this.sendSubscribeBracelet(deviceId);
            }
            break;
         case "oximeter":
            this.subscribedOximeterDevices.add(deviceId);
            if (this.isOximeterConnected) {
               this.sendSubscribeOximeter(deviceId);
            }
            break;
      }
   }

   public unsubscribeDevice(deviceId: string, deviceType: "bracelet" | "oximeter" | "radar"): void {
      if (!deviceId) return;

      switch (deviceType) {
         case "radar":
            this.subscribedRadarDevices.delete(deviceId);
            if (this.isRadarConnected) {
               this.sendUnsubscribeRadar(deviceId);
            }
            break;
         case "bracelet":
            this.subscribedBraceletDevices.delete(deviceId);
            if (this.isBraceletConnected) {
               this.sendUnsubscribeBracelet(deviceId);
            }
            break;
         case "oximeter":
            this.subscribedOximeterDevices.delete(deviceId);
            if (this.isOximeterConnected) {
               this.sendUnsubscribeOximeter(deviceId);
            }
            break;
      }
   }

   public isActive(): boolean {
      return this.isRadarConnected || this.isBraceletConnected || this.isOximeterConnected;
   }

   private sendSubscribeRadar(deviceId: string): void {
      if (this.wsRadar && this.isRadarConnected) {
         this.wsRadar.send(JSON.stringify({ type: "subscribe", deviceId }));
         console.log("[CSM WS] 雷达订阅:", deviceId);
      }
   }

   private sendUnsubscribeRadar(deviceId: string): void {
      if (this.wsRadar && this.isRadarConnected) {
         this.wsRadar.send(JSON.stringify({ type: "unsubscribe", deviceId }));
         console.log("[CSM WS] 雷达取消订阅:", deviceId);
      }
   }

   private sendSubscribeBracelet(deviceId: string): void {
      if (this.wsBracelet && this.isBraceletConnected) {
         this.wsBracelet.send(JSON.stringify({ type: "subscribe", deviceId }));
         console.log("[CSM WS] 手环订阅:", deviceId);
      }
   }

   private sendUnsubscribeBracelet(deviceId: string): void {
      if (this.wsBracelet && this.isBraceletConnected) {
         this.wsBracelet.send(JSON.stringify({ type: "unsubscribe", deviceId }));
         console.log("[CSM WS] 手环取消订阅:", deviceId);
      }
   }

   private sendSubscribeOximeter(deviceId: string): void {
      if (this.wsOximeter && this.isOximeterConnected) {
         this.wsOximeter.send(JSON.stringify({ type: "subscribe", deviceId }));
         console.log("[CSM WS] 血氧仪订阅:", deviceId);
      }
   }

   private sendUnsubscribeOximeter(deviceId: string): void {
      if (this.wsOximeter && this.isOximeterConnected) {
         this.wsOximeter.send(JSON.stringify({ type: "unsubscribe", deviceId }));
         console.log("[CSM WS] 血氧仪取消订阅:", deviceId);
      }
   }

   private resubscribeRadarDevices(): void {
      this.subscribedRadarDevices.forEach((deviceId) => this.sendSubscribeRadar(deviceId));
   }

   private resubscribeBraceletDevices(): void {
      this.subscribedBraceletDevices.forEach((deviceId) => this.sendSubscribeBracelet(deviceId));
   }

   private resubscribeOximeterDevices(): void {
      this.subscribedOximeterDevices.forEach((deviceId) => this.sendSubscribeOximeter(deviceId));
   }

   private handleOximeterMessage(message: any): void {
      this.callbacks.onOximeterData?.(this.parseOximeterData(message));
   }

   private handleBraceletMessage(message: any): void {
      this.callbacks.onBraceletData?.(this.parseBraceletData(message));
   }

   private handleRadarMessage(message: any): void {
      this.callbacks.onRadarData?.(this.parseRadarData(message));
   }

   private parseBraceletData(data: any): BraceletData {
      return {
         deviceId: data.deviceId || "",
         heartRate: data.heartRate,
         spo2: data.spo2,
         bloodOxygen: data.bloodOxygen,
         systolicPressure: data.systolicPressure,
         diastolicPressure: data.diastolicPressure,
         bodyTemperature: data.bodyTemperature,
         breathRate: data.breathRate,
         batteryVoltage: data.batteryVoltage,
         buttonStatus: data.buttonStatus,
         timestamp: data.timestamp || Date.now(),
      };
   }

   private parseOximeterData(data: any): OximeterData {
      return {
         deviceId: data.deviceId || "",
         heartRate: data.heartRate,
         spo2: data.spo2 || data.spo2,
         signalQuality: data.signalQuality,
         breathRate: data.breathRate,
         timestamp: data.timestamp || Date.now(),
      };
   }

   private parseRadarData(data: any): RadarData {
      return {
         deviceId: data.deviceId || "",
         distance: data.distance,
         heartRate: data.heartRate,
         breathRate: data.breathRate,
         environmentInterference: data.environmentInterference,
         timestamp: data.timestamp || Date.now(),
      };
   }

   private clearReconnectTimeout(deviceType: "radar" | "bracelet" | "oximeter"): void {
      switch (deviceType) {
         case "radar":
            if (this.reconnectTimeoutRadar) {
               clearTimeout(this.reconnectTimeoutRadar);
               this.reconnectTimeoutRadar = null;
            }
            break;
         case "bracelet":
            if (this.reconnectTimeoutBracelet) {
               clearTimeout(this.reconnectTimeoutBracelet);
               this.reconnectTimeoutBracelet = null;
            }
            break;
         case "oximeter":
            if (this.reconnectTimeoutOximeter) {
               clearTimeout(this.reconnectTimeoutOximeter);
               this.reconnectTimeoutOximeter = null;
            }
            break;
      }
   }

   private scheduleReconnect(deviceType: "radar" | "bracelet" | "oximeter"): void {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
         console.log("[CSM WS] 达到最大重连次数，停止重连");
         return;
      }

      const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
      console.log(`[CSM WS] ${deviceType} 通道 ${delay}ms 后尝试重连...`);

      this.reconnectAttempts++;

      switch (deviceType) {
         case "radar":
            this.reconnectTimeoutRadar = setTimeout(() => this.connectRadar(), delay);
            break;
         case "bracelet":
            this.reconnectTimeoutBracelet = setTimeout(() => this.connectBracelet(), delay);
            break;
         case "oximeter":
            this.reconnectTimeoutOximeter = setTimeout(() => this.connectOximeter(), delay);
            break;
      }
   }
}

export const csmWebSocketManager = new CSMWebSocketManager();
export default csmWebSocketManager;
