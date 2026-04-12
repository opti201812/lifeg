/**
 * 性能测试工具
 * 注意：此文件已废弃，因为 PersonnelUpdateManager 已被移除
 * 如需性能测试，请直接测试 Redux 更新和图表渲染性能
 */

export interface PerformanceTestResult {
   duration: number;
   updatesProcessed: number;
   averageUpdateInterval: number;
   memoryUsage: NodeJS.MemoryUsage;
   stats: any;
}

/**
 * 模拟高频数据更新测试
 * @deprecated 此函数已废弃，因为 PersonnelUpdateManager 已被移除
 */
export async function testHighFrequencyUpdates(
   personnelIds: number[],
   updateCount: number = 100,
   updateInterval: number = 10
): Promise<PerformanceTestResult> {
   console.warn("[PerformanceTest] testHighFrequencyUpdates 已废弃，因为 PersonnelUpdateManager 已被移除");
   return {
      duration: 0,
      updatesProcessed: 0,
      averageUpdateInterval: 0,
      memoryUsage: process.memoryUsage(),
      stats: {},
   };
}

/**
 * 运行完整的性能测试套件
 * @deprecated 此函数已废弃，因为 PersonnelUpdateManager 已被移除
 */
export async function runPerformanceTestSuite(): Promise<{
   highFrequencyTest: PerformanceTestResult;
   summary: string;
}> {
   console.warn("[PerformanceTest] runPerformanceTestSuite 已废弃，因为 PersonnelUpdateManager 已被移除");
   return {
      highFrequencyTest: await testHighFrequencyUpdates([], 0, 0),
      summary: "性能测试已废弃",
   };
}

// 开发环境下的性能监控辅助函数
export const performanceMonitor = {
   /**
    * 监控React组件渲染性能
    */
   monitorComponentRender: (componentName: string) => {
      const startTime = performance.now();
      return () => {
         const duration = performance.now() - startTime;
         if (duration > 16) {
            // 超过一帧的时间
            console.warn(`[PerformanceMonitor] ${componentName} 渲染耗时过长: ${duration.toFixed(2)}ms`);
         } else {
            console.debug(`[PerformanceMonitor] ${componentName} 渲染耗时: ${duration.toFixed(2)}ms`);
         }
      };
   },

   /**
    * 监控数据更新频率
    */
   monitorDataUpdates: (dataType: string, updateCount: number, timeWindow: number) => {
      const updateRate = updateCount / (timeWindow / 1000);
      console.log(`[PerformanceMonitor] ${dataType} 更新频率: ${updateRate.toFixed(1)} 次/秒`);

      if (updateRate > 10) {
         console.warn(`[PerformanceMonitor] ${dataType} 更新频率过高，可能影响性能`);
      }
   },
};
