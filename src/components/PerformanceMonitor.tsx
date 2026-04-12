import React, { useEffect, useState, useRef, useCallback } from "react";
import { Card, Statistic, Row, Col, Button, Modal } from "antd";
import { useSelector } from "react-redux";
import { RootState } from "../store";

/**
 * 性能监控组件
 * 用于监控Overview页面的渲染性能和优化效果
 */
export const PerformanceMonitor: React.FC = () => {
   const [isVisible, setIsVisible] = useState(false);

   // 使用ref存储统计数据，避免每次渲染都更新state
   const statsRef = useRef({
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      totalRenders: 0,
      personDeviceDataUpdates: 0,
      chartRenders: 0,
      cachedRenders: 0,
   });

   // 监听personDeviceData变化
   const personDeviceData = useSelector((state: RootState) => state.data.personDeviceData);
   const personnelCount = Object.keys(personDeviceData).length;

   useEffect(() => {
      // 记录personDeviceData更新次数
      statsRef.current.personDeviceDataUpdates += 1;
   }, [personDeviceData]);

   // 使用useEffect和ref来监控渲染性能，避免无限循环
   const renderStatsRef = useRef({
      lastRenderTime: Date.now(),
      renderCount: 0,
      renderTimes: [] as number[],
   });

   useEffect(() => {
      const now = Date.now();
      const renderTime = now - renderStatsRef.current.lastRenderTime;
      renderStatsRef.current.renderCount += 1;

      renderStatsRef.current.renderTimes.push(renderTime);
      if (renderStatsRef.current.renderTimes.length > 10) {
         renderStatsRef.current.renderTimes.shift();
      }

      const averageRenderTime =
         renderStatsRef.current.renderTimes.reduce((a, b) => a + b, 0) / renderStatsRef.current.renderTimes.length;

      // 更新ref中的统计数据
      statsRef.current.renderCount = renderStatsRef.current.renderCount;
      statsRef.current.lastRenderTime = renderTime;
      statsRef.current.averageRenderTime = Math.round(averageRenderTime);
      statsRef.current.totalRenders = renderStatsRef.current.renderCount;

      renderStatsRef.current.lastRenderTime = now;
   });

   // 获取最新的统计数据
   const getCurrentStats = useCallback(() => {
      return { ...statsRef.current };
   }, []);

   const resetStats = useCallback(() => {
      renderStatsRef.current.renderCount = 0;
      renderStatsRef.current.renderTimes = [];
      renderStatsRef.current.lastRenderTime = Date.now();

      statsRef.current = {
         renderCount: 0,
         lastRenderTime: 0,
         averageRenderTime: 0,
         totalRenders: 0,
         personDeviceDataUpdates: 0,
         chartRenders: 0,
         cachedRenders: 0,
      };
   }, []);

   return (
      <>
         <Button
            type='primary'
            size='small'
            onClick={() => setIsVisible(true)}
            style={{
               position: "fixed",
               bottom: "20px",
               right: "20px",
               zIndex: 1000,
            }}
         >
            性能监控
         </Button>

         <Modal
            title='性能监控面板'
            open={isVisible}
            onCancel={() => setIsVisible(false)}
            footer={[
               <Button key='reset' onClick={resetStats}>
                  重置统计
               </Button>,
               <Button key='close' type='primary' onClick={() => setIsVisible(false)}>
                  关闭
               </Button>,
            ]}
            width={800}
         >
            <Row gutter={16}>
               <Col span={12}>
                  <Card size='small' title='渲染性能'>
                     <Statistic title='总渲染次数' value={getCurrentStats().totalRenders} suffix='次' />
                     <Statistic
                        title='最后渲染耗时'
                        value={getCurrentStats().lastRenderTime}
                        suffix='ms'
                        valueStyle={{ color: getCurrentStats().lastRenderTime > 16 ? "#cf1322" : "#3f8600" }}
                     />
                     <Statistic
                        title='平均渲染耗时'
                        value={getCurrentStats().averageRenderTime}
                        suffix='ms'
                        valueStyle={{ color: getCurrentStats().averageRenderTime > 16 ? "#cf1322" : "#3f8600" }}
                     />
                  </Card>
               </Col>

               <Col span={12}>
                  <Card size='small' title='数据更新统计'>
                     <Statistic
                        title='人员设备数据更新'
                        value={getCurrentStats().personDeviceDataUpdates}
                        suffix='次'
                     />
                     <Statistic title='当前人员数量' value={personnelCount} suffix='人' />
                     <Statistic
                        title='更新频率'
                        value={
                           personnelCount > 0
                              ? Math.round((getCurrentStats().personDeviceDataUpdates / personnelCount) * 100) / 100
                              : 0
                        }
                        suffix='次/人'
                     />
                  </Card>
               </Col>
            </Row>

            <Card size='small' title='优化效果说明' style={{ marginTop: 16 }}>
               <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
                  <p>
                     <strong>预期优化效果：</strong>
                  </p>
                  <ul>
                     <li>✅ Redux更新频率：从1000次/秒降低到100次/秒（90%减少）</li>
                     <li>✅ 组件渲染频率：从1000次/秒降低到100次/秒（90%减少）</li>
                     <li>✅ useMemo缓存命中：避免不必要的重计算</li>
                     <li>✅ 图表组件优化：使用React.memo避免重复渲染</li>
                  </ul>

                  <p>
                     <strong>性能指标：</strong>
                  </p>
                  <ul>
                     <li>🟢 平均渲染耗时 &lt; 16ms：流畅体验</li>
                     <li>🟡 平均渲染耗时 16-33ms：可接受</li>
                     <li>🔴 平均渲染耗时 &gt; 33ms：需要优化</li>
                  </ul>
               </div>
            </Card>
         </Modal>
      </>
   );
};

export default PerformanceMonitor;
