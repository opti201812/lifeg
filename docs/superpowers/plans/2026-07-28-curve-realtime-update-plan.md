# CurveView 实时曲线更新实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `CurveView` 的曲线每 `REFRESH_INTERVAL`（5000ms）自动追加来自 WebSocket 的实时数据点。

**Architecture:** 在 `useHistoricalData` 中集中管理一个定时器，批量读取 Redux `personDeviceData`，通过新增的 `transformRealtimeDataToChartPoint` 转换为 `ChartDataPoint`，追加到 `historicalData` 中。`HighPerformanceChart` 检测到数据长度变化后自动调用 ECharts `appendData`。

**Tech Stack:** React 18, TypeScript, Redux Toolkit, ECharts, react-scripts

## Global Constraints

- 更新间隔固定为 `REFRESH_INTERVAL`（5000ms），批量追加数据点。
- 单个人员曲线数据维持约 1 小时滚动窗口。
- 不改动 `life-guard-shared-components` 图表库。
- 尽量复用现有 `HighPerformanceChart` 的增量更新能力。

---

## File Structure

| 文件 | 责任 |
|------|------|
| `src/components/Overview/components/CurveView/utils/dataTransformers.ts` | 新增 `transformRealtimeDataToChartPoint`，将聚合后的 `personDeviceData[personnelId]` 转换为单个 `ChartDataPoint` |
| `src/components/Overview/components/CurveView/utils/dataTransformers.test.ts` | 单元测试 `transformRealtimeDataToChartPoint` |
| `src/components/Overview/components/CurveView/hooks/useHistoricalData.ts` | 新增定时器、读取 Redux、批量追加数据点、控制数据量上限 |

---

## Task 1: 实现实时数据转换函数

**Files:**
- Modify: `src/components/Overview/components/CurveView/utils/dataTransformers.ts`
- Create: `src/components/Overview/components/CurveView/utils/dataTransformers.test.ts`

**Interfaces:**
- Consumes: `personDeviceData` 结构 `{ [personnelId]: { devices: { radar?: any, bracelet?: any, oximeter?: any }, timestamp?: number } }`
- Produces: `export const transformRealtimeDataToChartPoint = (personDeviceData: any, personnelId: number, now?: number): ChartDataPoint | null`

- [ ] **Step 1: 写测试**

在 `src/components/Overview/components/CurveView/utils/dataTransformers.test.ts` 写入：

```ts
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
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd "/Users/kingkevin/Project/LifeGuard/develop/code/LifeGuard Web"
npm test -- --watchAll=false --testPathPattern=dataTransformers.test.ts
```

Expected: FAIL with "transformRealtimeDataToChartPoint is not a function" 或类似错误。

- [ ] **Step 3: 实现转换函数**

在 `src/components/Overview/components/CurveView/utils/dataTransformers.ts` 末尾追加：

```ts
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
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd "/Users/kingkevin/Project/LifeGuard/develop/code/LifeGuard Web"
npm test -- --watchAll=false --testPathPattern=dataTransformers.test.ts
```

Expected: 4 tests PASS。

- [ ] **Step 5: 提交**

```bash
cd "/Users/kingkevin/Project/LifeGuard/develop/code/LifeGuard Web"
git add src/components/Overview/components/CurveView/utils/dataTransformers.ts
 git add src/components/Overview/components/CurveView/utils/dataTransformers.test.ts
git commit -m "feat(curve): 新增实时设备数据到 ChartDataPoint 转换函数"
```

---

## Task 2: 改造 useHistoricalData hook

**Files:**
- Modify: `src/components/Overview/components/CurveView/hooks/useHistoricalData.ts`

**Interfaces:**
- Consumes: `transformRealtimeDataToChartPoint` from Task 1; `REFRESH_INTERVAL` from `../utils/constants`; `RootState` from Redux store
- Produces: hook 返回结构不变 `{ historicalData, loadingHistory, loadHistoricalData }`，但 `historicalData` 会随 `REFRESH_INTERVAL` 自动追加实时数据

- [ ] **Step 1: 修改 useHistoricalData.ts**

完整替换文件内容如下（保留原有 `loadHistoricalData` 逻辑不变）：

```ts
import { useState, useCallback, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { ChartDataPoint } from "../../../../../shared";
import {
   transformHistoryDataToChartPoints,
   transformRealtimeDataToChartPoint,
} from "../utils/dataTransformers";
import axios from "axios";
import dayjs from "dayjs";
import config from "../../../../../config";
import { message } from "antd";
import { RootState } from "../../../../../store";
import { REFRESH_INTERVAL } from "../utils/constants";

export const useHistoricalData = (personnelIds: number[]) => {
   const [historicalData, setHistoricalData] = useState<Map<number, ChartDataPoint[]>>(new Map());
   const [loadingHistory, setLoadingHistory] = useState<Set<number>>(new Set());

   const personDeviceData = useSelector((state: RootState) => state.data.personDeviceData);
   const personDeviceDataRef = useRef(personDeviceData);
   personDeviceDataRef.current = personDeviceData;

   const lastSnapshotRef = useRef<Map<number, any>>(new Map());

   const loadHistoricalData = useCallback(
      async (personnelId: number) => {
         if (loadingHistory.has(personnelId)) {
            return;
         }

         if (historicalData.has(personnelId)) {
            return;
         }

         try {
            setLoadingHistory((prev) => new Set(prev).add(personnelId));

            const oneHourAgo = dayjs().subtract(1, "hour").format("YYYY-MM-DD HH:mm:ss");
            const now = dayjs().format("YYYY-MM-DD HH:mm:ss");

            const queryParams = new URLSearchParams({
               personnelId: personnelId.toString(),
               startDate: oneHourAgo,
               endDate: now,
            });

            const response = await axios.get(`${config.backend.url}/history?${queryParams.toString()}`, {
               headers: {
                  "Cache-Control": "no-cache",
               },
            });

            const chartData: ChartDataPoint[] = transformHistoryDataToChartPoints(response.data);

            setHistoricalData((prev) => {
               const next = new Map(prev);
               next.set(personnelId, chartData);
               return next;
            });
         } catch (error) {
            console.error(`[CurveView] ❌ 加载历史数据失败: personnelId=${personnelId}`, error);
            message.error(`加载人员 ${personnelId} 的历史数据失败`);
         } finally {
            setLoadingHistory((prev) => {
               const next = new Set(prev);
               next.delete(personnelId);
               return next;
            });
         }
      },
      [loadingHistory, historicalData]
   );

   useEffect(() => {
      if (personnelIds.length === 0) {
         return;
      }

      const interval = setInterval(() => {
         const currentData = personDeviceDataRef.current;
         const updates = new Map<number, ChartDataPoint>();
         const now = Date.now();

         personnelIds.forEach((personnelId) => {
            const latest = currentData[personnelId];
            const lastSnapshot = lastSnapshotRef.current.get(personnelId);
            if (!latest || latest === lastSnapshot) {
               return;
            }

            const point = transformRealtimeDataToChartPoint(currentData, personnelId, now);
            if (point) {
               updates.set(personnelId, point);
               lastSnapshotRef.current.set(personnelId, latest);
            }
         });

         if (updates.size === 0) {
            return;
         }

         setHistoricalData((prev) => {
            const next = new Map(prev);
            updates.forEach((point, personnelId) => {
               const existing = next.get(personnelId) || [];
               const maxPoints = Math.ceil(3600000 / REFRESH_INTERVAL);
               const merged = existing.length >= maxPoints
                  ? [...existing.slice(1), point]
                  : [...existing, point];
               next.set(personnelId, merged);
            });
            return next;
         });
      }, REFRESH_INTERVAL);

      return () => clearInterval(interval);
   }, [personnelIds]);

   return {
      historicalData,
      loadingHistory,
      loadHistoricalData,
   };
};
```

- [ ] **Step 2: TypeScript 类型检查**

```bash
cd "/Users/kingkevin/Project/LifeGuard/develop/code/LifeGuard Web"
npx tsc --noEmit
```

Expected: 无类型错误。

- [ ] **Step 3: 运行测试确认无回归**

```bash
cd "/Users/kingkevin/Project/LifeGuard/develop/code/LifeGuard Web"
npm test -- --watchAll=false --testPathPattern=dataTransformers.test.ts
```

Expected: 4 tests PASS。

- [ ] **Step 4: 提交**

```bash
cd "/Users/kingkevin/Project/LifeGuard/develop/code/LifeGuard Web"
git add src/components/Overview/components/CurveView/hooks/useHistoricalData.ts
git commit -m "feat(curve): useHistoricalData 每 REFRESH_INTERVAL 追加实时数据点"
```

---

## Task 3: 端到端验证

**Files:**
- 无文件修改，仅验证

- [ ] **Step 1: 启动后端和 Web**

```bash
# 终端 1：启动 backend
cd "/Users/kingkevin/Project/LifeGuard/develop/code/LifeGuard Backend"
npm start

# 终端 2：启动 web
cd "/Users/kingkevin/Project/LifeGuard/develop/code/LifeGuard Web"
npm start
```

- [ ] **Step 2: 进入曲线页面**

打开 `http://localhost:3000`，导航到"人员总览 → 曲线"标签页。

- [ ] **Step 3: 确认每 5 秒追加数据点**

打开浏览器控制台，观察：
- 曲线图表右侧是否有新数据点出现
- `personDeviceData` 在 Redux DevTools 中是否有更新
- `historicalData` 对应 personnelId 的数组长度是否递增

Expected：每 5 秒出现一个新数据点，窗口保持约 1 小时滚动。

- [ ] **Step 4: 性能观察**

在 50 个图表场景下：
- 打开 Chrome DevTools Performance 面板
- 记录 10 秒，观察 JS 执行时间和 FPS
- Expected：无长时间任务（>50ms），FPS 稳定在 30 以上

- [ ] **Step 5: 提交验证结果（如有调整）**

如果验证中发现需要调整代码，按最小修改原则修改并提交：

```bash
cd "/Users/kingkevin/Project/LifeGuard/develop/code/LifeGuard Web"
git add <changed-files>
git commit -m "fix(curve): 实时曲线更新验证后微调"
```

如果无需调整，此任务不产生新 commit。

---

## Self-Review

**Spec coverage:**
- [x] 每 `REFRESH_INTERVAL` 批量追加实时数据点 → Task 2
- [x] 单个人员 1 小时滚动窗口 → Task 2 中 `maxPoints = Math.ceil(3600000 / REFRESH_INTERVAL)`
- [x] 不改动图表库 → 无图表库文件修改
- [x] 复用 `HighPerformanceChart.appendData` → 通过 `historicalData` 长度变化触发
- [x] 50 个图表性能 → Task 2 单一定时器 + 批量 setState，Task 3 性能验证

**Placeholder scan:**
- [x] 无 TBD/TODO/"implement later"
- [x] 无 "Add appropriate error handling" 等模糊描述
- [x] 代码块包含实际可运行代码

**Type consistency:**
- [x] `transformRealtimeDataToChartPoint` 签名在 Task 1 和 Task 2 中一致
- [x] `useHistoricalData` 返回结构未改变
