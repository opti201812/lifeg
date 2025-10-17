// pages/Room/index.tsx

import React, { useState, useEffect, useRef } from "react";
import { Carousel, message, Button, Modal, Form, Tooltip } from "antd";
import { useDispatch, useSelector } from "react-redux";
import DailyDataSlide from "./DailyDataSlide";
import WeeklyDataSlide from "./WeeklyDataSlide";
import axios from "axios";
import config from "../../config/index";
import { RootState } from "../../store/index.js";
import { LeftOutlined, RightOutlined, DownOutlined } from "@ant-design/icons";
import { updateRoomData } from "../../store/dataSlice";
import RoomStatusSlide from "./RoomStatusSlide";
import ArmPersonnelModal from "../../components/ArmPersonnelModal";
import { useNavigate } from "react-router-dom";

const RoomPage: React.FC<{
   personnelId: number | null;
   roomId: number | null;
   associationId: string;
   initialSlide: number;
}> = ({ personnelId, roomId, associationId, initialSlide }) => {
   if (!roomId) return;
   const [roomInfo, setRoomInfo] = useState<{
      name: string;
      age: number;
      gender: string;
      roomId: number;
      personnelId?: number | null;
      associationId: string;
      templateId?: number;
   }>({ name: "", age: 0, gender: "", roomId: 0, personnelId: personnelId, associationId: "" });
   const roomData = useSelector((state: RootState) => state.data.rooms.find((room) => room.id === roomId));
   const carouselRef = useRef<any>(null);
   const [isMonitoringEnabled, setIsMonitoringEnabled] = useState(roomData?.enabled || false);
   const [isModalVisible, setIsModalVisible] = useState(false);
   const [form] = Form.useForm();
   const [currentSlide, setCurrentSlide] = useState(initialSlide || 0);
   const navigate = useNavigate();

   useEffect(() => {
      if (!roomId) return;

      // Fetch initial room data and personnel details
      const fetchData = async () => {
         try {
            const roomResponse = await axios.get(`${config.backend.url}/rooms/${roomId}`);
            const roomData = roomResponse.data;

            // Fetch personnel details if personnel_id is present
            let personnelData = null;
            if (roomData.personnel_id) {
               const personnelResponse = await axios.get(`${config.backend.url}/personnel/${roomData.personnel_id}`, {
                  withCredentials: true,
               });

               personnelData = personnelResponse.data;
            }

            setRoomInfo({
               ...roomData,
               age: personnelData?.age,
               gender: personnelData?.gender,
               roomId,
               personnelId: personnelId,
               associationId: associationId,
            });

            setIsMonitoringEnabled(!associationId);
         } catch (error) {
            console.error("Error fetching room data:", error);
            message.error("获取房间信息失败！");
         }
      };

      fetchData();
   }, [roomId, isMonitoringEnabled]);

   const getInitialHeartAndBreathRate = (
      heart_rate: any,
      heart_rate_resting: any,
      breath_rate: any,
      breath_rate_resting: any,
      avgHeartRate: any,
      avgBreathRate: any
   ) => {
      breath_rate = breath_rate ? parseInt(breath_rate) : 0;
      heart_rate_resting = heart_rate_resting ? parseInt(heart_rate_resting) : 0;
      heart_rate = heart_rate ? parseInt(heart_rate) : 0;
      breath_rate_resting = breath_rate_resting ? parseInt(breath_rate_resting) : 0;
      avgBreathRate = avgBreathRate ? parseInt(avgBreathRate) : 0;
      avgHeartRate = avgHeartRate ? parseInt(avgHeartRate) : 0;

      return {
         heartRate: heart_rate || avgHeartRate || 80,
         heartRateResting: heart_rate_resting || Math.max((heart_rate || avgHeartRate || 80) - 20, 30),
         breathRate: breath_rate || avgBreathRate || 30,
         breathRateResting: breath_rate_resting || Math.max((breath_rate || avgBreathRate || 30) - 8, 10),
      };
   };
   useEffect(() => {
      if (!roomId) return;
      const fetchRoomStatus = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/rooms/${roomId}/status`);
            let { breath_rate, heart_rate_resting, heart_rate, breath_rate_resting, avgHeartRate, avgBreathRate } =
               response.data;

            form.setFieldsValue(
               getInitialHeartAndBreathRate(
                  heart_rate,
                  heart_rate_resting,
                  breath_rate,
                  breath_rate_resting,
                  avgHeartRate,
                  avgBreathRate
               )
            );
            breath_rate = breath_rate ? parseInt(breath_rate) : 0;
            heart_rate_resting = heart_rate_resting ? parseInt(heart_rate_resting) : 0;
            heart_rate = heart_rate ? parseInt(heart_rate) : 0;
            breath_rate_resting = breath_rate_resting ? parseInt(breath_rate_resting) : 0;
            // setRoomStatus({ ...response.data, breath_rate, heart_rate_resting, heart_rate, breath_rate_resting });
            setIsMonitoringEnabled(response.data.enabled);
            if (heart_rate === 0 || breath_rate === 0 || heart_rate_resting === 0 || breath_rate_resting === 0) {
               form.setFieldsValue({
                  heartRate: avgHeartRate,
                  breathRate: avgBreathRate,
                  heartRateResting: avgHeartRate - 20,
                  breathRateResting: avgBreathRate - 8,
               });
            }
         } catch (error) {
            console.error("Error fetching room status:", error);
         }
      };
      fetchRoomStatus();
   }, [roomId]);

   useEffect(() => {
      // 当 initialSlide prop 发生变化时，或者组件首次加载且 initialSlide 有效时
      // 使用 goTo 方法确保轮播到正确的 initialSlide
      // 第二个参数 true 表示禁用动画，实现立即跳转
      if (carouselRef.current && typeof initialSlide === "number") {
         carouselRef.current.goTo(initialSlide, true);
         // 同步内部的 currentSlide 状态，尽管 Carousel 内部也会更新
         // 但这样做可以保持我们自己状态的一致性，以防万一需要基于此状态做其他操作
         setCurrentSlide(initialSlide);
      }
   }, [initialSlide]); // 依赖数组中只有 initialSlide

   useEffect(() => {
      // 需要确保离开房间页面时重置标题
      return () => {
         document.title = "人员总览"; // 或使用全局状态管理
      };
   }, []);

   return (
      <div style={{ margin: "0 auto", maxWidth: "1000px", width: "100%", height: "100%" }}>
         <Carousel
            autoplay={false}
            autoplaySpeed={10000}
            ref={carouselRef}
            // initialSlide={initialSlide} // 可以移除，因为我们通过 useEffect 和 goTo 控制
            afterChange={(current) => {
               // 这个回调仍然有用，用于响应用户手动滑动轮播图
               setCurrentSlide(current);
            }}
         >
            {/* 为每个 Slide 添加唯一的 key prop，这有助于 React 正确地更新它们 */}
            <RoomStatusSlide
               personnelId={personnelId}
               roomInfo={roomInfo}
               key={`slide-room-status-${roomId}-${personnelId}`}
               isActive={currentSlide === 0}
            />
            <DailyDataSlide
               roomId={roomId}
               roomInfo={roomInfo}
               key={`slide-daily-data-${roomId}`}
               isActive={currentSlide === 1}
            />
            <WeeklyDataSlide
               roomId={roomId}
               roomInfo={roomInfo}
               key={`slide-weekly-data-${roomId}`}
               isActive={currentSlide === 2}
            />
         </Carousel>

         <div style={{ marginTop: "10px", textAlign: "center" }}>
            <Button
               icon={<LeftOutlined />}
               onClick={() => carouselRef.current?.goTo((currentSlide - 1 + 3) % 3)}
               style={{ marginRight: "10px" }}
            />
            <Button icon={<RightOutlined />} onClick={() => carouselRef.current?.goTo((currentSlide + 1) % 3)} />
         </div>

         <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "10px" }}>
            <Tooltip title='调整设防参数' mouseEnterDelay={0.5}>
               <Button
                  type='primary'
                  danger={isMonitoringEnabled}
                  onClick={() => setIsModalVisible(true)}
                  style={{ height: 48, width: 160, fontSize: 24 }}
               >
                  变更
               </Button>
            </Tooltip>
            <Button
               type='default'
               danger
               onClick={() => {
                  Modal.confirm({
                     title: "确认解除关联",
                     content: "确定要解除当前人员与房间的关联吗？",
                     okText: "确认",
                     cancelText: "取消",
                     onOk: async () => {
                        try {
                           await axios.delete(`${config.backend.url}/associations/${associationId}`);
                           message.success("解除关联成功");
                           navigate("/overview"); // 返回人员总览
                        } catch (error) {
                           console.error("解除关联失败:", error);
                           message.error("解除关联失败");
                        }
                     },
                  });
               }}
               style={{ height: 48, width: 160, fontSize: 24 }}
            >
               撤防
            </Button>
         </div>

         <ArmPersonnelModal
            visible={isModalVisible}
            entryType='ROOM_DETAIL'
            actionType={isMonitoringEnabled ? "disarm" : "arm"}
            initialValues={{
               associationId: associationId,
               roomId: roomId,
            }}
            onCancel={() => setIsModalVisible(false)}
            onSubmit={() => setIsModalVisible(false)}
            title={isMonitoringEnabled ? "撤防" : "设防"}
         />
      </div>
   );
};

export default RoomPage;
