import { PlusOutlined } from "@ant-design/icons";
import { Button } from "antd";

// 报警级别文本映射
export const ALARM_LEVEL_TEXT = {
   1: "极度危险",
   2: "危险",
   3: "异常",
} as const;

// 报警级别颜色映射
export const ALARM_LEVEL_COLOR = ["error", "warning", "info", "success"] as const;

// 数据过期时间阈值（毫秒）
export const RADAR_DATA_EXPIRE_TIME = 10000;

// 刷新间隔时间（毫秒）
export const REFRESH_INTERVAL = 5000;

// 图标大小
export const ICON_SIZE = 24;

// 距离判断阈值
export const DISTANCE_THRESHOLDS = {
   BED: 30,
   CHAIR: 70,
} as const;
