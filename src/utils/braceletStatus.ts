export const getBraceletStatusText = (
   radarData: {
      heartRate?: number;
      environmentInterference?: number;
      breathRate?: number;
   },
   tamperStatus: number | null
): string => {
   // 判断是否满足报警条件
   const isAlertCondition =
      (radarData.heartRate !== undefined && (radarData.heartRate < 45 || radarData.heartRate > 90)) ||
      (radarData.environmentInterference !== undefined && radarData.environmentInterference < 12) ||
      (radarData.breathRate !== undefined && radarData.breathRate < 6);

   // 判断手环状态
   const isWearingBracelet = tamperStatus === 0 || tamperStatus === 1; // 0 表示已佩戴，1 表示手环松开

   // 优先显示报警提示
   if (isAlertCondition && !isWearingBracelet) {
      return "手环: 建议佩戴以进行双验证";
   }

   // 常规状态判断
   switch (tamperStatus) {
      case 1:
         return "手环: 松开";
      case 0:
         return "手环: 已佩戴";
      default:
         return "手环: 未佩戴";
   }
};
