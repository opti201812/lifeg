import { ChartDataPoint, SeriesConfig } from "../../../../../shared";
import { normalizeRadarDistanceToMeters } from "../../../../../shared/src/utils/radarDistance";

/**
 * 将历史数据转换为图表数据点格式
 */
export const transformHistoryDataToChartPoints = (data: any[]): ChartDataPoint[] => {
   return data
      .map((item: any) => {
         const timestamp = new Date(item.time).getTime();
         return {
            timestamp,
            // 基础体征
            heartRate: item.radar_heart_rate,
            breathRate: item.breath_rate,
            braceletHeartRate: item.bracelet_heart_rate,
            oximeterHeartRate: item.oximeter_heart_rate,
            systolicPressure: item.systolic_pressure,
            diastolicPressure: item.diastolic_pressure,
            spo2: item.spo2 || item.blood_oxygen,
            bodyTemperature: item.body_temperature,
            distance: item.distance,
            environmentInterference: item.environment_interference,
            reflection: item.reflection,
            // 心率分析 - 时域指标
            sdnn: item.sdnn,
            rmssd: item.rmssd,
            pnn50: item.pnn50,
            sdann: item.sdann,
            // 心率分析 - 频域指标
            lfPower: item.lf_power,
            hfPower: item.hf_power,
            lfHfRatio: item.lf_hf_ratio,
            // 呼吸指标
            breathRateVariabilitySD: item.breath_rate_variability_sd,
            breathAmplitudeVariabilityCV: item.breath_amplitude_variability_cv,
            // 综合评测
            stressEmotion: item.stress_emotion,
            fatigueTolerance: item.fatigue_tolerance,
            sleepQuality: item.sleep_quality,
            heartAttackRisk: item.heart_attack_risk,
            sleepStatus: item.sleep_status,
            posture: item.posture,
         };
      })
      .sort((a: ChartDataPoint, b: ChartDataPoint) => a.timestamp - b.timestamp);
};

/**
 * 将设备数据转换为图表数据点格式
 */
export const transformDeviceDataToChartPoints = (deviceData: any): ChartDataPoint[] => {
   const points: ChartDataPoint[] = [];

   if (!deviceData?.devices) {
      return points;
   }

   // 处理雷达数据
   if (deviceData.devices.radar) {
      const radarData = Array.isArray(deviceData.devices.radar) ? deviceData.devices.radar : [deviceData.devices.radar];

      radarData.forEach((radarItem: any) => {
         if (radarItem && radarItem.timestamp) {
            points.push({
               timestamp: radarItem.timestamp,
               heartRate: radarItem.heartRate,
               breathRate: radarItem.breathRate,
               distance: radarItem.distance,
               environmentInterference: radarItem.environmentInterference,
               reflection: radarItem.reflection,
               sdnn: radarItem.sdnn,
               rmssd: radarItem.rmssd,
               pnn50: radarItem.pnn50,
               sdann: radarItem.sdann,
               lfPower: radarItem.lfPower,
               hfPower: radarItem.hfPower,
               lfHfRatio: radarItem.lfHfRatio,
               breathRateVariabilitySD: radarItem.breathRateVariabilitySD,
               breathAmplitudeVariabilityCV: radarItem.breathAmplitudeVariabilityCV,
               stressEmotion: radarItem.stressEmotion,
               fatigueTolerance: radarItem.fatigueTolerance,
               sleepQuality: radarItem.sleepQuality,
               heartAttackRisk: radarItem.heartAttackRisk,
               sleepStatus: radarItem.sleepStatus,
               posture: radarItem.posture,
            });
         }
      });
   }

   // 处理手环数据
   if (deviceData.devices.bracelet && deviceData.devices.bracelet.timestamp) {
      const braceletItem = deviceData.devices.bracelet;
      points.push({
         timestamp: braceletItem.timestamp,
         braceletHeartRate: braceletItem.heartRate,
         systolicPressure: braceletItem.systolicPressure,
         diastolicPressure: braceletItem.diastolicPressure,
         spo2: braceletItem.spo2 || braceletItem.bloodOxygen,
         bodyTemperature: braceletItem.bodyTemperature,
      });
   }

   return points;
};

/**
 * 将实时聚合设备数据转换为单个图表数据点
 * 多雷达时按 environmentInterference 优选（与 processPersonnelDeviceData 保持一致）
 */
export const transformRealtimeDataToChartPoint = (
   personDeviceData: any,
   personnelId: number,
   now: number = Date.now()
): ChartDataPoint | null => {
   const deviceData = personDeviceData?.[personnelId];
   if (!deviceData?.devices) {
      return null;
   }

   const timestamp = deviceData.timestamp || now;

   // 雷达数据优选
   let selectedRadarData: any = null;
   if (deviceData.devices.radar) {
      const radarData = Array.isArray(deviceData.devices.radar)
         ? deviceData.devices.radar
         : [deviceData.devices.radar];
      const validRadarData = radarData.filter(
         (r: any) => r.environmentInterference != null && r.environmentInterference >= 0
      );
      if (validRadarData.length > 0) {
         selectedRadarData = validRadarData.reduce((prev: any, current: any) =>
            prev.environmentInterference < current.environmentInterference ? prev : current
         );
      }
   }

   const braceletData = deviceData.devices.bracelet;
   const oximeterData = deviceData.devices.oximeter;

   const parseNumeric = (value: any): number | undefined => {
      if (value === null || value === undefined || value === "-") return undefined;
      const parsed = typeof value === "number" ? value : parseFloat(value);
      return Number.isFinite(parsed) ? parsed : undefined;
   };

   const point: ChartDataPoint = { timestamp };

   if (selectedRadarData) {
      point.heartRate = parseNumeric(selectedRadarData.heartRate);
      point.breathRate = parseNumeric(selectedRadarData.breathRate);
      point.distance = parseNumeric(selectedRadarData.distance);
      point.environmentInterference = parseNumeric(selectedRadarData.environmentInterference);
      point.reflection = parseNumeric(selectedRadarData.reflection);
      point.sdnn = parseNumeric(selectedRadarData.sdnn);
      point.rmssd = parseNumeric(selectedRadarData.rmssd);
      point.pnn50 = parseNumeric(selectedRadarData.pnn50);
      point.sdann = parseNumeric(selectedRadarData.sdann);
      point.lfPower = parseNumeric(selectedRadarData.lfPower);
      point.hfPower = parseNumeric(selectedRadarData.hfPower);
      point.lfHfRatio = parseNumeric(selectedRadarData.lfHfRatio);
      point.breathRateVariabilitySD = parseNumeric(selectedRadarData.breathRateVariabilitySD);
      point.breathAmplitudeVariabilityCV = parseNumeric(selectedRadarData.breathAmplitudeVariabilityCV);
      point.stressEmotion = parseNumeric(selectedRadarData.stressEmotion);
      point.fatigueTolerance = parseNumeric(selectedRadarData.fatigueTolerance);
      point.sleepQuality = parseNumeric(selectedRadarData.sleepQuality);
      point.heartAttackRisk = parseNumeric(selectedRadarData.heartAttackRisk);
      point.sleepStatus = parseNumeric(selectedRadarData.sleepStatus);
      point.posture = parseNumeric(selectedRadarData.posture);
   }

   if (braceletData) {
      point.braceletHeartRate = parseNumeric(braceletData.heartRate);
      point.systolicPressure = parseNumeric(braceletData.systolicPressure);
      point.diastolicPressure = parseNumeric(braceletData.diastolicPressure);
      point.spo2 = parseNumeric(braceletData.spo2 || braceletData.bloodOxygen);
      point.bodyTemperature = parseNumeric(braceletData.bodyTemperature);
   }

   if (oximeterData) {
      point.oximeterHeartRate = parseNumeric(oximeterData.heartRate);
      point.spo2 = parseNumeric(oximeterData.spo2);
      point.signalQuality = parseNumeric(oximeterData.signalQuality);
   }

   const hasAnyValue = Object.entries(point).some(
      ([key, value]) => key !== "timestamp" && value !== undefined
   );
   return hasAnyValue ? point : null;
};

/**
 * 根据系列配置获取数据值
 */
export const getValueForSeries = (
   personnelId: number,
   seriesConfig: SeriesConfig,
   deviceInfo?: any,
   personDeviceData?: any
): number | null => {
   const parseNumericValue = (value: any): number | null => {
      if (value === null || value === undefined || value === "-") {
         return null;
      }
      const parsed = typeof value === "number" ? value : parseFloat(value);
      return Number.isFinite(parsed) ? parsed : null;
   };

   const getDeviceInfoValue = (sourceKey: string, transform?: (value: number) => number) => {
      if (!deviceInfo) return null;
      const rawValue = deviceInfo[sourceKey];
      const numericValue = parseNumericValue(rawValue);
      if (numericValue === null) {
         return null;
      }
      return transform ? transform(numericValue) : numericValue;
   };

   // 优先从 deviceInfo 获取（来自 roomPersonnel.deviceInfo，已经包含了最新数据）
   if (deviceInfo) {
      const key = seriesConfig.key;
      if (key === "distance") {
         // 兼容新旧后端：>5 视为厘米折算到米，≤5 认为已是米
         return getDeviceInfoValue("distance", (value) => normalizeRadarDistanceToMeters(value) ?? 0);
      }

      switch (key) {
         case "heartRate":
            return getDeviceInfoValue("heartRate");
         case "braceletHeartRate":
            return getDeviceInfoValue("braceletHeartRate") ?? getDeviceInfoValue("heartRate");
         case "oximeterHeartRate":
            return getDeviceInfoValue("oximeterHeartRate");
         case "breathRate":
            return getDeviceInfoValue("breathRate");
         case "environmentInterference":
            return getDeviceInfoValue("environmentInterference");
         case "systolicPressure":
            return getDeviceInfoValue("systolicPressure");
         case "diastolicPressure":
            return getDeviceInfoValue("diastolicPressure");
         case "spo2":
            return getDeviceInfoValue("spo2");
         case "bloodOxygen":
            return getDeviceInfoValue("bloodOxygen") ?? getDeviceInfoValue("spo2");
         case "bodyTemperature":
            return getDeviceInfoValue("bodyTemperature");
         default: {
            const genericValue = getDeviceInfoValue(key);
            if (genericValue !== null) {
               return genericValue;
            }
         }
      }
   }

   // 如果 deviceInfo 中没有，尝试从 Redux 直接获取（使用最新的 personDeviceData）
   const deviceData = personDeviceData?.[personnelId];
   if (deviceData?.devices) {
      const key = seriesConfig.key;
      const braceletData = deviceData.devices.bracelet;
      const oximeterData = deviceData.devices.oximeter;

      // 优先使用手环数据（对于心率）
      if (key === "heartRate" && deviceData.devices.bracelet?.heartRate) {
         const value = parseNumericValue(deviceData.devices.bracelet.heartRate);
         if (value !== null) {
            return value;
         }
      }
      if (key === "braceletHeartRate" && braceletData?.heartRate) {
         const value = parseNumericValue(braceletData.heartRate);
         if (value !== null) {
            return value;
         }
      }
      if (key === "systolicPressure" && braceletData?.systolicPressure) {
         const value = parseNumericValue(braceletData.systolicPressure);
         if (value !== null) {
            return value;
         }
      }
      if (key === "diastolicPressure" && braceletData?.diastolicPressure) {
         const value = parseNumericValue(braceletData.diastolicPressure);
         if (value !== null) {
            return value;
         }
      }
      if ((key === "bloodOxygen" || key === "spo2") && (braceletData?.bloodOxygen || braceletData?.spo2)) {
         const value = parseNumericValue(braceletData?.bloodOxygen ?? braceletData?.spo2);
         if (value !== null) {
            return value;
         }
      }
      if (key === "bodyTemperature" && braceletData?.bodyTemperature) {
         const value = parseNumericValue(braceletData.bodyTemperature);
         if (value !== null) {
            return value;
         }
      }
      if (key === "oximeterHeartRate" && oximeterData?.heartRate) {
         const value = parseNumericValue(oximeterData.heartRate);
         if (value !== null) {
            return value;
         }
      }
      if (key === "spo2" && oximeterData?.spo2) {
         const value = parseNumericValue(oximeterData.spo2);
         if (value !== null) {
            return value;
         }
      }
      // 使用雷达数据
      if (deviceData.devices.radar) {
         const radarData = Array.isArray(deviceData.devices.radar)
            ? deviceData.devices.radar
            : [deviceData.devices.radar];
         const validRadar = radarData.find((r: any) => {
            const envValue = parseNumericValue(r.environmentInterference);
            return envValue !== null && envValue > 0;
         });
         if (validRadar) {
            const rawValue = validRadar[key as keyof typeof validRadar];
            const numericValue = parseNumericValue(rawValue);
            if (numericValue !== null) {
               // distance 需要归一化到米（兼容新旧后端）
               return key === "distance" ? normalizeRadarDistanceToMeters(numericValue) ?? 0 : numericValue;
            }
         }
      }
   }

   // 最后回退
   return null;
};
