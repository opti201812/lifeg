# 前端（LifeGuard Web）规模扩展性能分析

> 分析日期：2026-08-25
> 场景：几十 ~ 几百台雷达/人员的总览页（卡片视图 + 曲线视图）
> 技术栈：React 18 + Redux Toolkit + ECharts 5（canvas）+ antd
> 状态：**分析已完成，暂未修改代码**。优化项见文末 [Todo List](#todo-list)。

## 1. 结论先行

| 雷达/人员数 | 结论 |
|---|---|
| 十几台 | 完全流畅，现有优化（LTTB 抽稀、增量 append、懒加载、虚拟化）足够 |
| 几十台（30-50） | **开始可感知卡顿**：历史数据请求风暴 + 卡片全量重渲 |
| 上百台 | **明显卡顿**：曲线视图首屏加载慢、滚动掉帧、心跳定时器 O(N) 阻塞 |
| 几百台 | **不可用**：单进程 JS 无法支撑几百个 ECharts 实例同时刷新 |

**核心判断**：前端瓶颈不在"每秒推多少包"（WebSocket 侧已有 1s/设备节流），而在两处：
1. **曲线视图每人员一个独立历史请求**（几十~几百并发请求直接压垮后端与浏览器）；
2. **卡片数据更新时整棵树从 store 到全部卡片重渲染**。

后端对应分析见 [radar-scale-performance-analysis.md](radar-scale-performance-analysis.md)。

## 2. 数据接入链路

```
WebSocket (后端 1s/设备节流)
  └─ WebSocketHandler.tsx  JSON.parse → updatePersonnelDeviceData (Redux, 按 personnelId 分片)
      └─ store/dataSlice.ts  personDeviceData[personnelId] = {...prev, ...data}
          ├─ 卡片视图:  usePersonnelData → allRoomPersonnel 全量重算 → CardView → 每卡渲染
          └─ 曲线视图:  useHistoricalData (setInterval 5s) 轮询转换 → OptimizedUnifiedChart → ECharts
```

## 3. 瓶颈分析（按严重程度排序）

### 🔴 瓶颈1：曲线视图"每人员一个历史请求"风暴（最严重）

[src/components/Overview/components/CurveView/hooks/useHistoricalData.ts](../LifeGuard%20Web/src/components/Overview/components/CurveView/hooks/useHistoricalData.ts#L36-L88) 的 `loadHistoricalData`：**每个人员独立发一次 `/history` 请求，拉过去 1 小时数据**。进入曲线视图时 `CurveView` 对所有人员并发触发（[CurveView/index.tsx:51-61](../LifeGuard%20Web/src/components/Overview/components/CurveView/index.tsx#L51-L61)）。

后端 [historyDataController.js](../LifeGuard%20Backend/src/controllers/fileControllers/historyDataController.js#L28-L98) 的 `getHistoricalData` 更严重——**每个请求都遍历 data 目录下所有 `personnel-*.csv` 文件**（`readdir` 全量 + `readDataFromCsvFileSync` 同步读匹配文件 + `parseCsvData` 全量解析），再按 personnelId 过滤：

| 人员数 | 并发请求数 | 后端单请求成本 |
|---|---|---|
| 15 | 15 | 读目录 + 匹配当日文件 |
| 50 | **50** | 50 × (读目录 + 读文件 + 解析) |
| 300 | **300** | 300 × 全量 CSV 扫描 |

浏览器对同一域名并发有限（~6-13），请求排长队；后端同步读文件 + CSV 解析也会被压垮。**双端同时爆**。

### 🔴 瓶颈2：实时刷新用 `setInterval(5000)` 全量轮询，O(人员数)

[useHistoricalData.ts:93-137](../LifeGuard%20Web/src/components/Overview/components/CurveView/hooks/useHistoricalData.ts#L93-L137)：每 `REFRESH_INTERVAL`（= **5000ms**，见 [constants.ts:13](../LifeGuard%20Web/src/components/Overview/utils/constants.ts#L13)）**遍历所有人员**，从 Redux `personDeviceData` 取快照转成点（`transformRealtimeDataToChartPoint` 每人员执行一次复杂解析），再对每个人员 `[...existing.slice(1), point]` **复制整个约 1 小时滚动数组**。

- 每人员数组约 `3600000/5000 = 720` 点（1 小时 / 5s），每 tick 每人复制 720 元素数组
- 50 人 = 每 5s 复制 ~3.6 万个数组元素 + 50 次 `transformRealtimeDataToChartPoint` 全量解析
- 300 人 = 每 5s ~21.6 万元素拷贝 + 300 次全量解析，**主线程明显阻塞**（解析含多雷达优选 reduce、parseNumeric 等）

> 注：数组长度由 `3600000 / REFRESH_INTERVAL` 决定，改 interval 会同时影响窗口长度，需留意。

### 🟡 瓶颈3：卡片网格整树重渲染（store → 全部卡片）

数据更新路径：WebSocket → [WebSocketHandler.tsx:147-155](../LifeGuard%20Web/src/services/WebSocketHandler.tsx#L147-L155) `updatePersonnelDeviceData` → store 变更 → 依赖 `personDeviceData` 的所有订阅者重渲。

- [Overview/index.tsx:42-82](../LifeGuard%20Web/src/components/Overview/index.tsx#L42-L82) 用**基于内容拼接的 key**（`allRoomPersonnelDataKey`，把每人的心率/呼吸/距离/血氧等拼接成串）驱动 `stableAllRoomPersonnel` 更新——**任一人员数据变化，key 全串重算，全部卡片重新渲染**
- [PersonnelCard/index.tsx:393-395](../LifeGuard%20Web/src/components/Overview/components/PersonnelCard/index.tsx#L393-L395) 特意移除了 `React.memo`（"避免数据更新时阻止实时更新"）——导致**每张卡每次都全量重渲**，且 `CardView` 也未 memo
- 每张卡 4 行 14+ 个指标、大量 DOM，几十张卡重排/重绘开销大

### 🟡 瓶颈4：曲线视图"每卡片一个 ECharts 实例"

`PersonnelChartCard` 每卡片嵌一个 `OptimizedUnifiedChart` → `UnifiedChart mode="multi"`（[PersonnelChartCard.tsx:97-112](../LifeGuard%20Web/src/components/Overview/components/CurveView/components/PersonnelChartCard.tsx#L97-L112)）。每个图表实例带：
- 1 秒 x 轴定时器 + 60s 清理定时器（[HighPerformanceChart.tsx:367-374](../LifeGuard%20Web/src/shared/src/components/charts/HighPerformanceChart.tsx#L367-L374)）
- 1 个 ResizeObserver

N 张卡 = N 个 ECharts canvas + 2N 个定时器 + N 个 ResizeObserver。50+ 实例时 canvas 内存、重绘压力上升，滚动时全部触发 resize。虽有多图表降级配置（`chartCount:12` → maxPoints 200、禁动画），但**卡片仍全量挂载，未用视口懒挂载**。

### 🟡 瓶颈5：`decimatedChartData` 用 `data.find()` 反查，O(N×M)

[UnifiedChart.tsx:306-340](../LifeGuard%20Web/src/shared/src/components/charts/UnifiedChart.tsx#L306-L340)：抽稀后重建数据时，对每个抽稀点执行 `data.find((p) => Math.abs(p.timestamp - timestamp) < 1000)`——**O(抽稀点数 × 全量点数)**，每个图表每次数据更新都重复。多图表场景被放大。

### 🟢 瓶颈6：全量人员数据聚合的缓存失效粒度

[usePersonnelData.ts:29-104](../LifeGuard%20Web/src/components/Overview/components/CurveView/hooks/usePersonnelData.ts#L29-L104) 用 `personDeviceDataKeys = Object.keys(personDeviceData).join(",")` 作缓存 key——只要**任意一人**设备数据更新（key 通常不变，因为 personDeviceData 的 key 集合不变），就走缓存命中路径，对**每个人员**重新执行 `processPersonnelDeviceData` + `getBraceletStatusText`，再 `{...roomPersonnel}` 展开全部对象。仍是 O(人数) 全量重建，只是避免了数组重排。

### 🟢 瓶颈7：comprehensive mock 每卡生成

[PersonnelChartCard.tsx:48-51](../LifeGuard%20Web/src/components/Overview/components/CurveView/components/PersonnelChartCard.tsx#L48-L51)：综合评测用 mock 数据每卡生成曲线（`generateComprehensiveMockData`），数据规模小时无碍，但也是每卡每渲染的纯 CPU 开销。

## 4. 量化估算

| 场景 | 历史请求数 | 每 5s 数组拷贝 | 重渲卡片数 |
|---|---|---|---|
| 15 台 | 15 | 1.1 万元素 | 15 |
| 50 台 | **50 并发** | **3.6 万元素** | 50 |
| 100 台 | **100 并发** | **7.2 万元素** | 100 |
| 300 台 | **300 并发** | **21.6 万元素** | 300（不可用） |

> 数组拷贝估算基于 `720 点/人 × 人数`（1 小时窗口 / 5s 采样），实际因数组 `slice(1)` 含对象引用复制，GC 压力略高于元素计数。

## 5. 建议优化（按投入产出排序）

1. **历史数据批量接口 + 前端合并请求**（P0）：后端加 `/history/batch?personnelIds=a,b,c` 一次读多人并**共享一次目录扫描**；或前端对 `/history` 做并发限流 + 合并（如每批 10 人）。彻底消除请求风暴。
2. **曲线视图实时刷新改增量追加**（P1）：复用现有 `useIncrementalAppender` / 结构共享思路，只追加变化人员的新点，避免每 5s 全量 `slice(1)+concat` 与全量 `transformRealtimeDataToChartPoint`。
3. **卡片级 `React.memo` + 细粒度剪枝**（P1）：给 `PersonnelCard` 加**自定义比较函数**（只比较该卡的 `deviceInfo` 引用/关键字段），而不是移除 memo；`DataItem`、数值区等子组件也用 memo。避免任一人员更新拖垮全部卡片。
4. **曲线视图视口懒挂载**（P2）：几十张卡时只渲染视口附近卡片（复用现有 LazyChart/VirtualizedChartGrid），滚动进入再挂 ECharts。降低 canvas 实例数、定时器数与内存。
5. **`decimatedChartData` 去 O(N×M)**（P2）：抽稀后按时间戳建 Map/二分索引替代 `data.find`。
6. **曲线视图首屏降载**（P2）：默认只加载前 N 人（如 10 人）历史，滚动/按需加载其余。
7. **聚合缓存按人员分片失效**（P2）：`usePersonnelData` 改为按 personnelId 细粒度缓存，仅重算变化人员，而不是全量 O(N) 重建。

**与后端对比**：后端根本瓶颈是"无缓存磁盘读"（一处分母性开销，几十台才显现）；前端根本瓶颈是"每人员/每卡片的全量级操作"（N 份并发与 N 份全量，**几十台即显现**）——前端比后端更早到达拐点。

## Todo List

> 均标注优先级（P0=收益最大/风险最低）。当前**未开始实施**。

- [ ] **P0** 后端新增 `/history/batch` 批量接口：一次扫描目录、一次读取多个人员当日 CSV，返回合并数据（共享目录扫描，消除 N 次全量遍历）
  - 涉及：[LifeGuard Backend src/controllers/fileControllers/historyDataController.js](../LifeGuard%20Backend/src/controllers/fileControllers/historyDataController.js#L28)
- [ ] **P0** 前端曲线视图历史请求合并/限流：进入页面时对多人分批请求（如每批 10 人），或直接改用 batch 接口
  - 涉及：[LifeGuard Web src/components/Overview/components/CurveView/hooks/useHistoricalData.ts](../LifeGuard%20Web/src/components/Overview/components/CurveView/hooks/useHistoricalData.ts#L36)
  - 验证：50/300 人进入曲线视图的首屏加载耗时、后端请求数
- [ ] **P1** 曲线视图实时刷新改增量追加：只追加变化人员的新点，避免每 5s 全量 `slice(1)+concat` 与全量转换
  - 涉及：[useHistoricalData.ts:93-137](../LifeGuard%20Web/src/components/Overview/components/CurveView/hooks/useHistoricalData.ts#L93-L137)
- [ ] **P1** `PersonnelCard` 加自定义比较函数版 `React.memo`（只比较该卡关键字段/deviceInfo 引用）；`CardView`、`DataItem` 等子组件 memo 化
  - 涉及：[PersonnelCard/index.tsx](../LifeGuard%20Web/src/components/Overview/components/PersonnelCard/index.tsx)、[CardView/index.tsx](../LifeGuard%20Web/src/components/Overview/components/CardView/index.tsx)
  - 验证：单人员数据更新时其余卡片是否跳过重渲染
- [ ] **P1** 曲线视图卡片视口懒挂载：仅渲染视口附近卡片，滚动进入再挂 ECharts 实例
  - 涉及：[CurveView/index.tsx](../LifeGuard%20Web/src/components/Overview/components/CurveView/index.tsx)、[PersonnelChartCard.tsx](../LifeGuard%20Web/src/components/Overview/components/CurveView/components/PersonnelChartCard.tsx)
  - 验证：50/300 卡滚动流畅度、ECharts 实例数
- [ ] **P2** `decimatedChartData` 用时间戳 Map/二分索引替代 `data.find`，去 O(N×M)
  - 涉及：[UnifiedChart.tsx:306-340](../LifeGuard%20Web/src/shared/src/components/charts/UnifiedChart.tsx#L306-L340)
- [ ] **P2** `usePersonnelData` 聚合缓存按人员分片失效，仅重算变化人员
  - 涉及：[usePersonnelData.ts:29-104](../LifeGuard%20Web/src/components/Overview/components/CurveView/hooks/usePersonnelData.ts#L29-L104)
- [ ] **P2** 曲线视图首屏只加载前 N 人历史，按需/滚动加载其余
  - 涉及：[CurveView/index.tsx:51-61](../LifeGuard%20Web/src/components/Overview/components/CurveView/index.tsx#L51-L61)

---

### 附：核实的关键常量

- `REFRESH_INTERVAL = 5000`（[constants.ts:13](../LifeGuard%20Web/src/components/Overview/utils/constants.ts#L13)）：曲线视图实时刷新周期，滚动数组长度 `3600000 / 5000 = 720` 点/人
- `DATA_REFRESH_INTERVAL = 15000`（[chartConfig.ts:63](../LifeGuard%20Web/src/config/chartConfig.ts#L63)）：另一处 15s 刷新（总览数据轮询）
- 后端 history 接口：`readdir(historyDataDir)` 全量目录扫描 + `readDataFromCsvFileSync` 同步读文件 + `parseCsvData` 全量解析，按 personnelId/日期过滤
