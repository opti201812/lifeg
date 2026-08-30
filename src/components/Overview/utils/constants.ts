export const ALARM_LEVEL_TEXT = {
   1: "极度危险",
   2: "危险",
   3: "异常",
} as const;

export const ALARM_LEVEL_COLOR = ["error", "warning", "info", "success"] as const;

export const RADAR_DATA_EXPIRE_TIME = 10000;

export const BRACELET_HOLD_TIME = 70000;

export const REFRESH_INTERVAL = 5000;

export const ICON_SIZE = 24;

export const DISTANCE_THRESHOLDS = {
   BED: 30,
   CHAIR: 70,
} as const;
