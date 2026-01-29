export const getBraceletStatusText = (
   radarData: {
      heartRate?: number;
      environmentInterference?: number;
      breathRate?: number;
   },
   tamperStatus: number | null,
   hasBracelet: boolean,
): string => {
   // 未分配手环：报警且没有手环则建议佩戴，否则未分配
   if (!hasBracelet) {
      const isAlertCondition =
         (radarData.heartRate !== undefined && (radarData.heartRate < 45 || radarData.heartRate > 90)) ||
         (radarData.environmentInterference !== undefined && radarData.environmentInterference < 12) ||
         (radarData.breathRate !== undefined && radarData.breathRate < 6);
      if (isAlertCondition) {
         return "手环: 未分配\n建议佩戴以进行双验证";
      }
      return "手环: 未分配";
   }

   // 已分配手环，仅根据 tamperStatus 0/1 显示
   switch (tamperStatus) {
      case 1:
         return "手环: 松开";
      case 0:
         return "手环: 已佩戴";
      default:
         return "";
   }
};
