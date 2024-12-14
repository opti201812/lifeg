// pages/Room/index.tsx

import React, { useState, useEffect, useRef } from "react";
import { Carousel, message, Button, Modal, Form, InputNumber, Input, Select, Row, Col, Menu, Dropdown } from "antd";
import { useDispatch, useSelector } from "react-redux";
import DailyDataSlide from "./DailyDataSlide";
import WeeklyDataSlide from "./WeeklyDataSlide";
import axios from "axios";
import config from "../../config/index";
import { RootState } from "../../store/index.js";
import { LeftOutlined, RightOutlined, DownOutlined } from "@ant-design/icons";
import { updateRoomData } from "../../store/dataSlice";
import RoomStatusSlide from "./RoomStatusSlide";

const RoomPage: React.FC<{ roomId: number | null }> = ({ roomId }) => {
   if (!roomId) return;
   const [roomInfo, setRoomInfo] = useState<{
      name: string;
      age: number;
      gender: string;
      roomId: number;
      personnelId?: number | null;
   }>({ name: "", age: 0, gender: "", roomId: 0, personnelId: 0 });
   const roomData = useSelector((state: RootState) => state.data.rooms.find((room) => room.id === roomId));
   const carouselRef = useRef<any>(null);
   const dispatch = useDispatch();
   const [isMonitoringEnabled, setIsMonitoringEnabled] = useState(roomData?.enabled || false);
   const [isModalVisible, setIsModalVisible] = useState(false);
   const [avgHeartRateIn5Minutes, setAvgHeartRateIn5Minutes] = useState<number>(0);
   const [avgBreathRateIn5Minutes, setAvgBreathRateIn5Minutes] = useState<number>(0);
   const [form] = Form.useForm();
   const [personnelList, setPersonnelList] = useState<any[]>([]);

   useEffect(() => {
      const fetchPersonnel = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/personnel`);
            setPersonnelList(response.data);
         } catch (error) {
            console.error("Error fetching personnel:", error);
            message.error("获取人员信息失败");
         }
      };
      fetchPersonnel();
   }, []);

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
               personnelId: roomData.personnel_id,
            });

            setIsMonitoringEnabled(roomData.enabled);
         } catch (error) {
            console.error("Error fetching room data:", error);
            message.error("获取房间信息失败！");
         }
      };

      fetchData();
   }, [roomId, isMonitoringEnabled]);

   const getInitialHeartAndBreathRate = (
      breath_rate: any,
      heart_rate_resting: any,
      heart_rate: any,
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
                  breath_rate,
                  heart_rate_resting,
                  heart_rate,
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
               setAvgHeartRateIn5Minutes(avgHeartRate);
               setAvgBreathRateIn5Minutes(avgBreathRate);
            }
         } catch (error) {
            console.error("Error fetching room status:", error);
         }
      };
      fetchRoomStatus();
   }, [roomId]);

   const handleToggleMonitoring = async () => {
      const newEnabledStatus = !isMonitoringEnabled;
      if (!newEnabledStatus || roomData?.personnel_id) {
         await toggleMonitoring(newEnabledStatus);
      } else {
         setIsModalVisible(true);
         form.setFieldsValue({
            personnel_name: "临时人员" + Date.now().toString().slice(-4),
         });
      }
   };

   const toggleMonitoring = async (enabled: boolean, personnelId?: number) => {
      try {
         await axios.put(`${config.backend.url}/rooms/${roomId}`, { enabled, personnel_id: personnelId });
         setIsMonitoringEnabled(enabled);
         setRoomInfo((roomInfo) => ({
            ...roomInfo,
            personnelId: personnelId || null,
         }));
         dispatch(updateRoomData({ roomId, data: { ...roomData, enabled, personnel_id: personnelId } }));
         message.success(`已切换为：${enabled ? "设防" : "撤防"}状态`);
      } catch (error) {
         console.error("Error toggling monitoring:", error);
         message.error("切换监控状态失败");
      }
   };

   const onFinish = async (values: any) => {
      const { personnel_name, heartRate, breathRate, heartRateResting, breathRateResting } = values;
      // 将now转换为2024-11-18 12:06:35格式
      const formattedNow = new Date().toLocaleString("zh-CN", {
         year: "numeric",
         month: "2-digit",
         day: "2-digit",
         hour: "2-digit",
         minute: "2-digit",
         second: "2-digit",
      });
      const payload = {
         ...values,
         id_number: values.id_number || "",
         name: personnel_name,
         breath_rate: breathRate,
         heart_rate: heartRate,
         heart_rate_resting: heartRateResting,
         breath_rate_resting: breathRateResting,
         is_out: false,
         remark: formattedNow + " - " + personnel_name,
      };

      try {
         let personnelId;
         if (values.personnel_id) {
            await axios.put(`${config.backend.url}/personnel/${values.personnel_id}`, payload);
            personnelId = values.personnel_id;
            message.success("数据更新成功");
         } else {
            const response = await axios.post(`${config.backend.url}/personnel`, payload);
            personnelId = response.data.id;
            message.success("新增人员成功");
         }
         setIsModalVisible(false);
         toggleMonitoring(true, personnelId);
      } catch (error) {
         console.error("更新数据失败:", error);
         message.error("更新数据失败，请重试");
      }
   };

   const createFormItem = (label: string, name: string) => (
      <Form.Item
         label={label}
         name={name}
         key={name}
         rules={[
            { required: true, message: "请输入" + label },
            { type: "number", message: "请输入数字" },
         ]}
      >
         <InputNumber />
      </Form.Item>
   );

   const personnelMenu = (
      <Menu
         style={{ height: "50vh", overflowY: "auto", marginLeft: "5em" }}
         onClick={(info) => {
            const selectedPerson = personnelList.find((person) => person.name === info.key);
            console.log("==> ~ selectedPerson:", selectedPerson);
            if (selectedPerson) {
               const { heart_rate, heart_rate_resting, breath_rate, breath_rate_resting } = selectedPerson;
               form.setFieldsValue({
                  personnel_id: selectedPerson.id,
                  personnel_name: selectedPerson.name,
                  ...getInitialHeartAndBreathRate(
                     heart_rate,
                     heart_rate_resting,
                     breath_rate,
                     breath_rate_resting,
                     avgHeartRateIn5Minutes,
                     avgBreathRateIn5Minutes
                  ),
               });
            } else {
               form.setFieldsValue({
                  personnel_id: null,
               });
            }
            form.setFieldsValue({ personnel_name: info.key });
         }}
      >
         {personnelList.map((person) => (
            <Menu.Item key={person.name}>{person.name}</Menu.Item>
         ))}
      </Menu>
   );

   return (
      <div style={{ margin: "0 auto", maxWidth: "1000px", width: "100%", height: "100%" }}>
         {!isMonitoringEnabled ? (
            <div
               style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "70vh",
               }}
            >
               <Button
                  type='primary'
                  onClick={handleToggleMonitoring}
                  style={{ height: 48, width: 160, fontSize: 24, marginBottom: 20 }}
               >
                  设防
               </Button>
               <p style={{ margin: 0 }}>当前房间未设防</p>
            </div>
         ) : (
            <>
               <Carousel autoplay={false} autoplaySpeed={10000} ref={carouselRef}>
                  <RoomStatusSlide roomId={roomId} roomInfo={roomInfo} />
                  <DailyDataSlide roomId={roomId} roomInfo={roomInfo} />
                  <WeeklyDataSlide roomId={roomId} roomInfo={roomInfo} />
               </Carousel>
               <div style={{ marginTop: "10px", textAlign: "center" }}>
                  <Button
                     icon={<LeftOutlined />}
                     onClick={() => carouselRef.current?.prev()}
                     style={{ marginRight: "10px" }}
                  />
                  <Button icon={<RightOutlined />} onClick={() => carouselRef.current?.next()} />
               </div>
               <div style={{ textAlign: "center", marginTop: "10px" }}>
                  <Button type='primary' danger onClick={handleToggleMonitoring}>
                     撤防
                  </Button>
               </div>
            </>
         )}

         <Modal
            title='人员信息和检测基准'
            open={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            footer={[
               <Button key='back' onClick={() => setIsModalVisible(false)}>
                  取消
               </Button>,
               <Button key='submit' type='primary' onClick={() => form.submit()}>
                  确定
               </Button>,
            ]}
         >
            <Form form={form} onFinish={onFinish}>
               <Row gutter={16}>
                  <Col span={12}>
                     <Dropdown overlay={personnelMenu} trigger={["click"]}>
                        <Form.Item label='人员姓名' name='personnel_name'>
                           <Input
                              style={{ width: 200 }}
                              placeholder='选择或输入人员'
                              onBlur={(event) => {
                                 const value = event.target.value;
                                 const selectedPerson = personnelList.find((person) => person.name === value);
                                 if (selectedPerson) {
                                    form.setFieldsValue({
                                       personnel_id: selectedPerson.id,
                                       personnel_name: selectedPerson.name,
                                       heartRate: selectedPerson.heart_rate,
                                       heartRateResting: selectedPerson.heart_rate_resting,
                                       breathRate: selectedPerson.breath_rate,
                                       breathRateResting: selectedPerson.breath_rate_resting,
                                    });
                                 } else {
                                    form.setFieldsValue({
                                       personnel_id: null,
                                    });
                                 }
                              }}
                              suffix={<DownOutlined />}
                           />
                        </Form.Item>
                     </Dropdown>
                  </Col>
                  <Col span={6}>
                     <Form.Item label='personnel_id' name='personnel_id' hidden>
                        <Input />
                     </Form.Item>
                  </Col>
                  <Col span={6}>
                     <Form.Item label='id_number' name='id_number' hidden>
                        <Input />
                     </Form.Item>
                  </Col>
               </Row>
               <Row gutter={16}>
                  <Col span={12}>{createFormItem("平时心率", "heartRate")}</Col>
                  <Col span={12}>{createFormItem("平时呼吸率", "breathRate")}</Col>
               </Row>
               <Row gutter={16}>
                  <Col span={12}>{createFormItem("静息心率下限", "heartRateResting")}</Col>
                  <Col span={12}>{createFormItem("静息呼吸率下限", "breathRateResting")}</Col>
               </Row>
               <Row gutter={16}>
                  <Col span={12}>
                     <Form.Item name='remark' hidden>
                        <Input />
                     </Form.Item>
                  </Col>
               </Row>
            </Form>
            <p style={{ fontSize: 13, color: "gray" }}>
               {`供参考：过去5分钟平均心率为${avgHeartRateIn5Minutes || "-"}次/分，平均呼吸率为${
                  avgBreathRateIn5Minutes || "-"
               }次/分`}
            </p>
         </Modal>
      </div>
   );
};

export default RoomPage;
