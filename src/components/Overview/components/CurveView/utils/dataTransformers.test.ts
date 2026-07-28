import { transformRealtimeDataToChartPoint } from "./dataTransformers";

describe("transformRealtimeDataToChartPoint", () => {
   it("returns null when no device data", () => {
      expect(transformRealtimeDataToChartPoint({}, 1)).toBeNull();
   });

   it("returns null when no valid fields", () => {
      const data = {
         1: {
            devices: {},
            timestamp: 1000,
         },
      };
      expect(transformRealtimeDataToChartPoint(data, 1)).toBeNull();
   });

   it("prefers radar with lowest environmentInterference", () => {
      const data = {
         1: {
            devices: {
               radar: [
                  { deviceId: "A", environmentInterference: 5, heartRate: 70 },
                  { deviceId: "B", environmentInterference: 2, heartRate: 72 },
               ],
            },
            timestamp: 1000,
         },
      };
      const point = transformRealtimeDataToChartPoint(data, 1);
      expect(point).not.toBeNull();
      expect(point?.heartRate).toBe(72);
      expect(point?.environmentInterference).toBe(2);
   });

   it("extracts bracelet and oximeter fields", () => {
      const data = {
         1: {
            devices: {
               bracelet: { heartRate: 75, spo2: 98, timestamp: 1000 },
               oximeter: { heartRate: 76, spo2: 97, timestamp: 1000 },
            },
            timestamp: 2000,
         },
      };
      const point = transformRealtimeDataToChartPoint(data, 1);
      expect(point?.braceletHeartRate).toBe(75);
      expect(point?.oximeterHeartRate).toBe(76);
      expect(point?.spo2).toBe(97);
      expect(point?.timestamp).toBe(2000);
   });
});
