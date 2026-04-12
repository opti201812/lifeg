# 睡眠时长图表组件 (SleepDurationChart)

## 概述

用于在"人员总览"的"曲线"/"综合评测"标签页卡片中展示睡眠数据的专用图表组件。

## 文件结构

```
SleepDurationChart/
├── index.tsx              # 主组件（支持自动模拟数据）
├── mockData.ts            # 模拟数据生成器
└── README.md              # 本文件
```

## 功能特性

### 0. 自动模拟数据（新功能）

-  **默认行为**：当数据为空或全为 0 时，自动使用睡眠质量好的模拟数据
-  **开发友好**：无需手动准备数据即可看到图表效果
-  **可配置**：通过 `useMockDataWhenEmpty` 属性控制是否启用
-  **演示数据**：使用 `generateGoodSleepData(8)` 生成 8 个数据点的优质睡眠数据

### 1. 堆叠面积图

-  **深睡**（蓝色）：展示深度睡眠时长
-  **浅睡**（橙色）：展示浅睡眠时长
-  **清醒**（红色）：展示清醒时长

通过堆叠显示方式，可以直观看到：

-  各睡眠状态的**相对比例**
-  睡眠质量的**整体情况**
-  不同时间的**睡眠状态变化**

### 2. 趋势线（绿色）

-  展示**总睡眠时长**的增长趋势
-  与面积图结合，既展现状态分布，也展现时长增长

### 3. 自适应数据采样

-  数据点超过 20 个时，自动采样
-  避免图表过于拥挤
-  保持可读性和性能

### 4. 交互式 Tooltip

-  鼠标悬停显示详细数据
-  展示各睡眠状态和总睡眠时长
-  自定义样式美观易读

## 使用方式

### 基础用法

```tsx
import SleepDurationChart from "./SleepDurationChart";

// 方式1：传入真实数据
<SleepDurationChart
  data={realSleepData}
  height={200}
/>

// 方式2：数据为空时自动使用优质睡眠模拟数据（默认行为）
<SleepDurationChart
  data={[]}  // 空数据
  height={200}
  useMockDataWhenEmpty={true}  // 默认值，可省略
/>

// 方式3：禁用模拟数据，显示空状态
<SleepDurationChart
  data={[]}
  height={200}
  useMockDataWhenEmpty={false}
/>
```

### 手动使用模拟数据

```tsx
import SleepDurationChart from "./SleepDurationChart";
import { generateGoodSleepData, generateMockSleepData } from "./mockData";

// 使用优质睡眠数据
const goodSleepData = generateGoodSleepData(8);
<SleepDurationChart data={goodSleepData} height={200} />;

// 使用通用模拟数据
const mockData = generateMockSleepData(7);
<SleepDurationChart data={mockData} height={200} />;
```

### 使用真实数据

```tsx
// 假设从 API 获取实际的睡眠数据
const [sleepData, setSleepData] = useState<ChartDataPoint[]>([]);

useEffect(() => {
   fetchSleepData().then(setSleepData);
}, []);

<SleepDurationChart data={sleepData} height={200} />;
```

## 模拟数据函数

### 1. `generateMockSleepData(days?: number)`

生成基于时间规律的通用模拟数据

```tsx
import { generateMockSleepData } from "./mockData";

const data = generateMockSleepData(7); // 7天数据
```

### 2. `generateGoodSleepData(count?: number)`

生成睡眠质量好的数据

```tsx
const data = generateGoodSleepData(5); // 5个数据点
// 深睡: 80-110分钟, 浅睡: 35-55分钟, 清醒: 3-13分钟
```

### 3. `generatePoorSleepData(count?: number)`

生成睡眠质量差的数据

```tsx
const data = generatePoorSleepData(5); // 5个数据点
// 深睡: 10-40分钟, 浅睡: 20-50分钟, 清醒: 30-80分钟
```

### 4. `generateLongTermSleepData(days?: number)`

生成长期睡眠追踪数据（呈上升趋势）

```tsx
const data = generateLongTermSleepData(30); // 30天数据
// 睡眠质量逐渐改善
```

### 5. `generatePartialDataScenario()`

生成数据较少的场景

```tsx
const data = generatePartialDataScenario(); // 3个数据点
```

### 6. `generateNoDataScenario()`

生成无数据的场景

```tsx
const data = generateNoDataScenario(); // 显示"暂无睡眠数据"
```

## 数据结构

输入数据应为 `ChartDataPoint[]` 类型，包含以下字段：

-  `timestamp`: 时间戳
-  `deepSleepDuration`: 深睡时长（分钟）
-  `lightSleepDuration`: 浅睡时长（分钟）
-  `awakeDuration`: 清醒时长（分钟）
-  `totalSleepDuration`: 总睡眠时长（分钟）

## 集成位置

在 `CurveView/index.tsx` 中：

-  当 `activeSubTab === "comprehensive"` 时，使用 `SleepDurationChart`
-  其他标签页继续使用原有的折线图

下方的实测值显示区域：

-  综合评测下显示：**压力值、疲劳值、心梗值、睡眠质量**
-  其他标签页按原有逻辑显示

## 视觉设计

-  使用渐变填充，增加视觉层次感
-  颜色选择符合医疗行业规范
-  自动适应卡片大小
-  支持打印

## 调试和测试

### 快速测试

组件已内置自动模拟数据功能，无需准备数据即可测试：

```tsx
import SleepDurationChart from "./SleepDurationChart";
import { generateGoodSleepData } from "./mockData";

export const TestComponent = () => {
   return <SleepDurationChart data={generateGoodSleepData()} height={300} />;
};
```

## 兼容性

-  React 18+
-  TypeScript
-  ECharts 5.5.1+
-  echarts-for-react 3.0.2+
