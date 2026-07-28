# CurveView 实时曲线更新设计

## 背景

当前 `CurveView`（人员总览 → 曲线）的图表数据来自 `useHistoricalData`，该 hook 只在组件挂载时通过 HTTP 拉取一次过去 1 小时的历史数据，之后不再更新。

与此同时，WebSocket 推送的实时设备数据会更新 Redux 中的 `personDeviceData`，用于人员卡片和表格的实时显示，但**没有流入曲线图表**。因此曲线页面在初始加载后处于静止状态。

## 目标

让 `CurveView` 的曲线每 `REFRESH_INTERVAL`（当前为 5000ms）自动追加来自 WebSocket 的实时数据点，同时保证单页面多达 50 个 echarts 组件的渲染性能。

## 约束

- 更新间隔固定为 `REFRESH_INTERVAL`（5000ms），批量追加数据点。
- 单个人员曲线数据维持约 1 小时滚动窗口。
- 不改动 `life-guard-shared-components` 图表库。
- 尽量复用现有 `HighPerformanceChart` 的增量更新能力。

## 方案对比

| 方案 | 描述 | 优点 | 缺点 |
|------|------|------|------|
| A（推荐） | 在 `useHistoricalData` 中集中管理定时器，批量转换 `personDeviceData` 并追加 | 改动最小；整个 CurveView 只有一个定时器；直接复用 `HighPerformanceChart.appendData` | `useHistoricalData` 引入 Redux 依赖 |
| B | 在 `WebSocketHandler` 中直接追加到新的 Redux slice | 数据流最清晰；CurveView 无定时器 | 需新增 slice 和清理逻辑；改动范围大 |
| C | 每个 `PersonnelChartCard` 各自维护定时器 | 卡片自治 | 50 个定时器，性能差，不同步 |

## 推荐方案：方案 A

### 数据流

```
WebSocket → Redux personDeviceData
                ↓
   useHistoricalData（每 5s 批量转换）
                ↓
      historicalData Map 更新
                ↓
   CurveView → PersonnelChartCard → OptimizedUnifiedChart
                ↓
   UnifiedChart → HighPerformanceChart.appendData()
```

### 文件变更

| 文件 | 变更 |
|------|------|
| `src/components/Overview/components/CurveView/hooks/useHistoricalData.ts` | 新增定时器、读取 Redux、批量追加数据点 |
| `src/components/Overview/components/CurveView/utils/dataTransformers.ts` | 新增 `transformRealtimeDataToChartPoint` |
| `src/components/Overview/components/CurveView/index.tsx` | 不修改 |
| `src/components/Overview/components/CurveView/components/PersonnelChartCard.tsx` | 不修改 |
| `life-guard-shared-components/src/components/charts/UnifiedChart.tsx` | 不修改 |
| `life-guard-shared-components/src/components/charts/HighPerformanceChart.tsx` | 不修改 |

### 关键实现

#### 1. useHistoricalData.ts

- 使用 `useSelector` 订阅 `state.data.personDeviceData`。
- 使用 `useRef` 保存最新 `personDeviceData` 快照，避免 WebSocket 高频更新导致定时器重建。
- 使用 `useRef` 保存上一次的 `personDeviceData[personnelId]` 引用，避免重复转换未变化人员。
- 每 `REFRESH_INTERVAL` 毫秒批量转换并追加新的 `ChartDataPoint`。
- 通过函数式 `setHistoricalData` 一次更新所有人员数据。
- 限制单个人员数据点数量，维持 1 小时滚动窗口。

```ts
const personDeviceData = useSelector((state: RootState) => state.data.personDeviceData);
const personDeviceDataRef = useRef(personDeviceData);
personDeviceDataRef.current = personDeviceData;

const lastSnapshotRef = useRef<Map<number, any>>(new Map());

useEffect(() => {
   if (personnelIds.length === 0) return;

   const interval = setInterval(() => {
      const currentData = personDeviceDataRef.current;
      const updates = new Map<number, ChartDataPoint>();
      const now = Date.now();

      personnelIds.forEach((id) => {
         const latest = currentData[id];
         const lastSnapshot = lastSnapshotRef.current.get(id);
         if (!latest || latest === lastSnapshot) return;

         const point = transformRealtimeDataToChartPoint(latest, id, now);
         if (point) {
            updates.set(id, point);
            lastSnapshotRef.current.set(id, latest);
         }
      });

      if (updates.size === 0) return;

      setHistoricalData((prev) => {
         const next = new Map(prev);
         updates.forEach((point, id) => {
            const existing = next.get(id) || [];
            const maxPoints = Math.ceil(3600000 / REFRESH_INTERVAL);
            const merged = existing.length >= maxPoints
               ? [...existing.slice(1), point]
               : [...existing, point];
            next.set(id, merged);
         });
         return next;
      });
   }, REFRESH_INTERVAL);

   return () => clearInterval(interval);
}, [personnelIds]);
```

#### 2. dataTransformers.ts

新增 `transformRealtimeDataToChartPoint` 函数：

- 接收 `personDeviceData[personnelId]`、`personnelId`、`timestamp`。
- 复用 `processPersonnelDeviceData` 中的字段提取逻辑（雷达优选、手环缓存、血氧仪等）。
- 生成包含所有 `ChartDataPoint` 可选字段的数据点。
- 如果关键字段均无有效数值，返回 `null`。

### 性能保障

1. **单一定时器**：整个 `CurveView` 只有一个 `setInterval`。
2. **引用比较**：`lastSnapshotRef` 避免对未变化人员重复转换。
3. **批量 setState**：一次更新所有人员数据。
4. **数据点上限**：每人最多约 720 个点（1h / 5s）。
5. **appendData**：`HighPerformanceChart` 已使用 ECharts `appendData`，不重绘整个图表。
6. **React.memo + LTTB**：`OptimizedUnifiedChart` 和 `UnifiedChart` 已有自定义比较函数和 LTTB 抽稀。

### 错误处理

- `personDeviceData[personnelId]` 不存在时跳过该人员。
- 转换失败时记录 `console.error`，不影响其他人员。
- 保留原有 HTTP 历史数据加载的错误处理。

### 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 定时器随 WebSocket 高频更新而重建 | 用 `ref` 保存 `personDeviceData`，不放入 `useEffect` 依赖 |
| 内存持续增长 | 通过 `maxPoints` 限制单个人员数据量 |
| 数据缺失 | 单点转换失败跳过，不影响整体 |
| 时间窗口漂移 | `HighPerformanceChart` 每分钟清理过期数据作为双重保险 |

## 后续可优化

- 根据 `activeSubTab` 只转换当前标签页需要的字段，减少无效计算。
- 当用户离开"曲线"标签页时暂停定时器，进一步降低资源占用。
- 将 `REFRESH_INTERVAL` 配置化，允许按环境调整。

## 验收标准

- [ ] 进入"人员总览 → 曲线"页面后，曲线每 5 秒追加最新数据点。
- [ ] 单页面 50 个图表同时更新时，页面保持流畅（无卡顿、掉帧）。
- [ ] 切换标签页或路由后，定时器正确清理，无内存泄漏。
- [ ] 历史数据加载失败时，实时更新仍可进行。
