import React, { useState, useMemo, useEffect } from "react";
import { Tabs, Row, Col } from "antd";
import { RoomPersonnel } from "../../types";
import AddPersonnelCard from "../AddPersonnelCard";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../../../store";

// 导入自定义 Hooks
import { useHistoricalData } from "./hooks/useHistoricalData";
import { usePersonnelData } from "./hooks/usePersonnelData";
import { useSeriesConfig } from "./hooks/useSeriesConfig";

// 导入子组件
import PersonnelChartCard from "./components/PersonnelChartCard";
import ChartLegendBar from "./components/ChartLegendBar";

// 导入配置
import chartConfig from "../../../../config/chartConfig";

interface CurveViewProps {
   onCardClick: (roomPersonnel: RoomPersonnel) => void;
   onAddPersonnel: (roomId: number) => void;
}

const CurveView: React.FC<CurveViewProps> = ({ onCardClick, onAddPersonnel }) => {
   const [activeSubTab, setActiveSubTab] = useState<string>("basic");

   // 获取当前房间ID（从路由参数）
   const { roomId } = useParams<{ roomId?: string }>();

   // 从 Redux 获取显示配置
   const showPersonnelName = useSelector((state: RootState) => state.alertConfig.data?.isPersonNameVisible ?? false);

   // 获取其他 Redux 数据用于 AddPersonnelCard
   const associations = useSelector((state: RootState) => state.data.associations);
   const roomTypes = useSelector((state: RootState) => state.data.roomTypes);
   const roomTemplates = useSelector((state: RootState) => state.data.roomTemplates);

   // 使用自定义 Hooks
   const { allRoomPersonnel } = usePersonnelData(roomId);
   const personnelIds = useMemo(
      () => allRoomPersonnel.map((rp) => rp.personnel?.id).filter((id): id is number => id !== undefined),
      [allRoomPersonnel]
   );
   const { historicalData, loadingHistory, loadHistoricalData } = useHistoricalData(personnelIds);
   const { legendVisible, currentGroupSeries, activeSeriesConfigs, seriesConfigs, handleLegendToggle } =
      useSeriesConfig(activeSubTab);

   // 监听 allRoomPersonnel 变化，为新人员加载历史数据
   useEffect(() => {
      allRoomPersonnel.forEach((roomPersonnel) => {
         if (roomPersonnel.personnel) {
            const personnelId =
               typeof roomPersonnel.personnel.id === "string"
                  ? parseInt(roomPersonnel.personnel.id, 10)
                  : roomPersonnel.personnel.id;
            loadHistoricalData(personnelId);
         }
      });
   }, [allRoomPersonnel, loadHistoricalData]);

   // 处理二级Tab切换
   const handleSubTabChange = (key: string) => {
      setActiveSubTab(key);
   };

   // 二级Tab项
   const subTabItems = [
      { key: "basic", label: "基础体征" },
      { key: "analysis", label: "心率分析" },
      { key: "comprehensive", label: "综合评测" },
      { key: "sleep", label: "睡眠分析" },
   ];

   // 稳定的空数组
   const emptyChartData = useMemo(() => [], []);

   // 渲染人员卡片网格
   const renderPersonnelCards = () => {
      return allRoomPersonnel.map((roomPersonnel) => {
         if (roomPersonnel.personnel) {
            const personnelId =
               typeof roomPersonnel.personnel.id === "string"
                  ? parseInt(roomPersonnel.personnel.id, 10)
                  : roomPersonnel.personnel.id;
            const chartData = historicalData.get(personnelId) || emptyChartData;
            const isLoadingHistoryCard = loadingHistory.has(personnelId);

            return (
               <PersonnelChartCard
                  key={`personnel-${roomPersonnel.associationId}`}
                  roomPersonnel={roomPersonnel}
                  chartData={chartData}
                  isLoadingHistory={isLoadingHistoryCard}
                  activeSubTab={activeSubTab}
                  activeSeriesConfigs={activeSeriesConfigs}
                  currentGroupSeries={currentGroupSeries}
                  seriesConfigs={seriesConfigs}
                  showPersonnelName={showPersonnelName}
                  onCardClick={onCardClick}
               />
            );
         } else {
            // 空白卡片（设防功能）
            return (
               <Col span={chartConfig.cardGridSpan} key={`add-${roomPersonnel.room.id}`}>
                  <AddPersonnelCard
                     room={roomPersonnel.room}
                     associations={associations}
                     roomTypes={roomTypes}
                     roomTemplates={roomTemplates}
                     onAddClick={onAddPersonnel}
                  />
               </Col>
            );
         }
      });
   };

   return (
      <div className='curve-view-container'>
         {/* 二级Tab */}
         <div
            style={{
               background: "#fff",
               borderRadius: "8px",
               boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
               marginBottom: "16px",
            }}
         >
            <Tabs
               activeKey={activeSubTab}
               onChange={handleSubTabChange}
               items={subTabItems}
               style={{ margin: 0, padding: "0 16px" }}
               tabBarStyle={{ marginBottom: 0, borderBottom: "1px solid #f0f0f0" }}
            />
         </div>

         {/* 卡片网格容器 + 图例条 */}
         <div
            style={{
               background: "#fff",
               borderRadius: "8px",
               boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
               padding: "12px 16px 16px",
            }}
         >
            {/* 图例条 */}
            <ChartLegendBar
               seriesConfigs={currentGroupSeries}
               legendVisible={legendVisible}
               onToggle={handleLegendToggle}
            />

            {/* 人员卡片网格 */}
            <Row gutter={[16, 16]}>{renderPersonnelCards()}</Row>
         </div>
      </div>
   );
};

export default CurveView;
