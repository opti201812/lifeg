import React, { useState, useEffect, useCallback } from "react";
import { Card, Row, Col, Tag, Button, Typography, Table, Tabs, message, Avatar } from "antd";
import { HeartOutlined, BellOutlined, UserOutlined, PlusOutlined } from "@ant-design/icons";
import { FaBed, FaChair, FaWalking } from "react-icons/fa";
import axios from "axios";
import dayjs from "dayjs";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import { setRooms, updatePersonnelDeviceData } from "../../store/dataSlice";
import config from "../../config";
import ArmPersonnelModal from "../ArmPersonnelModal";
import "./styles.css";
import { Route, useParams } from "react-router-dom";
import { RadarData } from "../../types";
import RoomPage from "../../pages/Room";
import { getBraceletStatusText } from "../../utils/braceletStatus";

interface Room {
   id: number;
   name: string;
   typeId: number;
   enabled?: boolean;
   personnelName?: string;
   personnel_id?: number;
   person_pose?: string;
   mattress_distance?: number;
   distance?: number;
   heartRate?: number;
   breathRate?: number;
   environmentInterference?: any;
   networkFailure?: boolean;
   radarFailure?: boolean;
   radarAbnormal?: boolean;
   schedules?: any[];
   remark?: string;
   config?: {
      maxPersonnel: number;
   };
}

interface Association {
   id?: number;
   associationId?: number;
   personnelId: number;
   braceletId: string | null;
   roomId: number;
   radarIds: string[];
}

interface Personnel {
   id: number;
   name: string;
   gender: string;
   age: number;
   id_number?: string;
   phone?: string;
   address?: string;
   is_out?: boolean;
}

interface RoomPersonnel {
   room: Room;
   personnel: Personnel | null;
   associationId: string;
}

interface NewOverviewProps {
   roomId?: string;
}

const NewOverview: React.FC<NewOverviewProps> = () => {
   const { roomId } = useParams<{ roomId: string }>();
   const [showPersonnelName, setShowPersonnelName] = useState(false);
   const [activeTab, setActiveTab] = useState<string>("card");
   const [rooms, setRoomsState] = useState<Room[]>([]);
   const [associations, setAssociations] = useState<Association[]>([]);
   const [personnel, setPersonnel] = useState<Personnel[]>([]);
   const [loading, setLoading] = useState(false);
   const [isArmModalVisible, setIsArmModalVisible] = useState(false);
   const [armModalInitValues, setArmModalInitValues] = useState<{ roomId?: number }>({});
   const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
   const personDeviceData = useSelector((state: RootState) => state.data.personDeviceData);

   const alarms = useSelector((state: RootState) => state.data.alarms);
   const dispatch = useDispatch();

   // 房间详情查看状态
   const [selectedRoom, setSelectedRoom] = useState<{
      roomId: number;
      roomInfo: { name: string; age: number; gender: string; personnelId?: number | null };
      associationId: string;
      initialSlide: number;
   } | null>(null);

   // 获取数据
   const fetchData = useCallback(async () => {
      setLoading(true);
      try {
         // 获取房间列表
         const roomsResponse = await axios.get(`${config.backend.url}/rooms`);
         const roomsData = roomsResponse.data.map((room: Room) => ({
            ...room,
            enabled: room.enabled,
         }));

         // 获取关联情况
         const associationsResponse = await axios.get(`${config.backend.url}/associations`);
         const associationsData = associationsResponse.data.data || [];

         // 获取人员数据
         const personnelResponse = await axios.get(`${config.backend.url}/personnel`);
         const personnelData = personnelResponse.data || [];

         // 更新状态
         setRoomsState(roomsData);
         setAssociations(associationsData);
         setPersonnel(personnelData);

         // 更新Redux store
         dispatch(setRooms(roomsData));

         // 获取SMS配置
         const smsConfigResponse = await axios.get(`${config.backend.url}/smsconfig`);
         const isPersonNameVisibleConfig = smsConfigResponse.data.find(
            (config: any) => config.config_name === "isPersonNameVisible"
         );
         setShowPersonnelName(isPersonNameVisibleConfig?.value === "true" || isPersonNameVisibleConfig?.value === true);
      } catch (error) {
         console.error("获取数据失败:", error);
         message.error("获取数据失败，请检查网络连接");
      } finally {
         setLoading(false);
      }
   }, [dispatch]);

   useEffect(() => {
      fetchData();
   }, [fetchData]);

   // 当报警状态变化时，对房间进行排序
   // useEffect(() => {
   //    const sortedRooms = [...rooms].sort((a, b) => {
   //       const aHasAlarm = alarms.some((alarm) => alarm.roomId === a.id);
   //       const bHasAlarm = alarms.some((alarm) => alarm.roomId === b.id);
   //       if (aHasAlarm && !bHasAlarm) return -1; // a排在前面
   //       if (!aHasAlarm && bHasAlarm) return 1; // b排在前面
   //       return 0; // 顺序不变
   //    });
   //    setRoomsState(sortedRooms);
   // }, [alarms]);

   // 获取房间的所有人员（重构：直接遍历associations）
   const getAllRoomPersonnel = useCallback(() => {
      // 获取有房间关联的人员
      const occupiedRooms = associations
         .filter((a) => !roomId || String(a.roomId) === String(roomId))
         .map((a) => {
            const room = a.roomId
               ? rooms.find((r) => String(r.id) === String(a.roomId))
               : {
                    id: -1,
                    name: "待分配房间",
                    typeId: 0,
                    enabled: false,
                 };
            const personnelData = personnel.find((p) => String(p.id) === String(a.personnelId));
            return {
               room: room || { id: -1, name: "待分配房间", typeId: 0, enabled: false },
               personnel: personnelData || null,
               associationId: String(a.id || ""),
            };
         })
         .filter(Boolean) as RoomPersonnel[];

      // 获取所有房间ID
      const allRoomIds = rooms.map((r) => r.id);
      // 获取已占用的房间ID
      const occupiedRoomIds = new Set(occupiedRooms.map((rp) => rp.room.id).filter((id) => id !== -1));

      // 添加空房间
      const emptyRooms = rooms
         .filter((room) => !occupiedRoomIds.has(room.id) && (!roomId || String(room.id) === String(roomId)))
         .map((room) => ({
            room,
            personnel: null,
            associationId: "",
         }));

      // 合并并排序
      return [...occupiedRooms, ...emptyRooms].sort((a, b) => {
         if (a.room.id === -1 && b.room.id !== -1) return 1;
         // 待分配房间排在已分配房间之后，空房间之前
         return a.room.id - b.room.id;
      });
   }, [rooms, associations, personnel, roomId]);

   // 判断是否在限制时段内
   const isInRestrictedSchedule = useCallback((room: Room) => {
      if (!room.personnel_id || !room.schedules || room.schedules.length === 0) {
         return false; // 没有关联人员或时间表，不受限制
      }

      const now = dayjs();
      const currentYear = now.year();
      const currentMonth = now.month() + 1; // 月份从0开始
      const currentDay = now.date();
      const currentHour = now.hour();
      const currentMinute = now.minute();

      const currentDateTime = dayjs(new Date(currentYear, currentMonth - 1, currentDay, currentHour, currentMinute));

      for (const schedule of room.schedules) {
         const daysOfWeek = JSON.parse(schedule.days_of_week);

         for (const dateRange of daysOfWeek) {
            const [startDate, endDate] = dateRange.map((date: string) => dayjs(date, "YYYY-MM-DD"));
            let date = startDate;

            while (date.isBefore(endDate) || date.isSame(endDate, "day")) {
               const [startHour, startMinute] = schedule.start_time.split(":").map(Number);
               const [endHour, endMinute] = schedule.end_time.split(":").map(Number);

               let startDateTime = date.hour(startHour).minute(startMinute);
               let endDateTime = date.hour(endHour).minute(endMinute);

               // 处理跨天的时间表
               if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
                  endDateTime = endDateTime.add(1, "day"); // 将结束时间移至次日
               }

               if (currentDateTime.isAfter(startDateTime) && currentDateTime.isBefore(endDateTime)) {
                  return true; // 在限制时段内
               }

               date = date.add(1, "day"); // 移至下一天
            }
         }
      }

      return false; // 不在任何限制时段内
   }, []);

   // 获取标签信息
   const getTagInfo = useCallback(
      (room: Room) => {
         if (isInRestrictedSchedule(room)) {
            return { text: "搁置时段", color: "orange" };
         } else if (room.networkFailure) {
            return { text: "网络故障", color: "red" };
         } else if (room.radarFailure) {
            return { text: "雷达故障", color: "red" };
         } else if (room.radarAbnormal) {
            return { text: "雷达异常", color: "red" };
         } else {
            return { text: "采集中", color: "green" };
         }
      },
      [isInRestrictedSchedule]
   );

   // 获取图标
   const getIcon = useCallback((room: Room) => {
      const iconSize = 24;
      if (!room.enabled) return null;
      if (room.person_pose === "坐姿" || !room.mattress_distance) return <FaChair color='orange' />;

      const distanceValue = room.mattress_distance - (room.distance ? room.distance * 100 : 0);

      if (distanceValue === 0 || room.distance === undefined) {
         return <FaWalking color='red' style={{ fontSize: iconSize + "px" }} />; // 离开图标
      } else if (distanceValue < 30) {
         return <FaBed color='green' style={{ fontSize: iconSize + "px" }} />; // 卧床图标
      } else if (distanceValue < 70) {
         return <FaChair color='orange' style={{ fontSize: iconSize + "px" }} />; // 坐姿图标
      } else {
         return <FaWalking color='red' style={{ fontSize: iconSize + "px" }} />; // 离开图标
      }
   }, []);

   // 处理设防对话框
   const handleArm = (roomId: number) => {
      setArmModalInitValues({ roomId });
      setIsArmModalVisible(true);
   };

   // 处理设防表单提交
   const handleArmSubmit = async (values: any) => {
      try {
         // 创建关联
         // await axios.post(`${config.backend.url}/associations`, {
         //    personnelId: values.personnelId,
         //    braceletId: values.braceletId || null,
         //    roomId: values.roomId,
         //    radarIds: values.radarId ? [values.radarId] : [],
         // });

         // message.success("设防成功");
         setIsArmModalVisible(false);
         fetchData(); // 刷新数据
      } catch (error) {
         console.error("设防失败:", error);
         message.error("设防失败，请稍后重试");
      }
   };

   // 表格列定义
   const columns = [
      {
         title: "房间号",
         dataIndex: ["room", "name"],
         key: "roomName",
      },
      {
         title: "人员姓名",
         key: "personnelName",
         render: (_: unknown, record: RoomPersonnel) => {
            if (!record.personnel) {
               return (
                  <Button type='primary' icon={<PlusOutlined />} onClick={() => handleArm(record.room.id)}>
                     设防
                  </Button>
               );
            }
            return record.personnel.name;
         },
      },
      {
         title: "性别",
         key: "gender",
         render: (_: unknown, record: RoomPersonnel) => {
            return record.personnel ? record.personnel.gender : "-";
         },
      },
      {
         title: "年龄",
         key: "age",
         render: (_: unknown, record: RoomPersonnel) => {
            return record.personnel ? record.personnel.age : "-";
         },
      },
      {
         title: "身份证号",
         key: "idNumber",
         render: (_: unknown, record: RoomPersonnel) => {
            return record.personnel?.id_number ? record.personnel.id_number : "-";
         },
      },
      {
         title: "备注",
         dataIndex: ["room", "remark"],
         key: "remark",
         render: (text: string) => text || "-",
      },
      {
         title: "操作",
         key: "action",
         render: (_: unknown, record: RoomPersonnel) => {
            if (!record.personnel) {
               return null; // 对于"添加"行，已经有设防按钮了
            }
            return (
               <Button
                  type='link'
                  onClick={() => {
                     if (record.personnel) {
                        setSelectedRoom({
                           roomId: record.room.id,
                           roomInfo: {
                              name: record.personnel.name,
                              age: record.personnel.age,
                              gender: record.personnel.gender,
                              personnelId: record.personnel.id,
                           },
                           associationId: record.associationId,
                           initialSlide: 0,
                        });
                     }
                  }}
               >
                  查看详情
               </Button>
            );
         },
      },
   ];

   // 渲染房间卡片
   const renderPersonnelCard = (roomPersonnel: RoomPersonnel) => {
      const { room, personnel: personnelData, associationId } = roomPersonnel;

      // 对待分配房间进行特殊处理
      const isUnassigned = room.id === -1;
      const roomName = isUnassigned ? "待分配房间" : room.name;

      // 如果是空卡片（用于设防按钮）
      if (!personnelData) {
         return (
            <Col span={6} key={`${room.id}-add`}>
               <Card bordered={false} className='add-personnel-card'>
                  <div
                     style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "200px",
                     }}
                  >
                     <Button
                        type='primary'
                        icon={<PlusOutlined />}
                        onClick={() => handleArm(room.id)}
                        style={{ marginBottom: 16 }}
                     >
                        设防
                     </Button>
                     <div>{roomName}</div>
                  </div>
               </Card>
            </Col>
         );
      }

      // 获取人员设备数据
      const deviceData = personDeviceData[personnelData.id];

      // 选择手环数据
      const braceletData = deviceData?.devices?.bracelet;

      // 选择环境值较大的雷达数据
      let selectedRadarData = null,
         radarData = null;
      if (deviceData?.devices?.radar) {
         radarData = deviceData.devices.radar;
         const filteredRadarData = radarData.filter((r: RadarData) => r.environmentInterference > 0);

         if (filteredRadarData.length > 0) {
            selectedRadarData = filteredRadarData.reduce((prev: RadarData, current: RadarData) =>
               prev.environmentInterference > current.environmentInterference ? prev : current
            );
         }
      }

      // 如果有手环数据，优先显示手环心率
      const heartRate = braceletData ? braceletData.heartRate : selectedRadarData ? selectedRadarData.heartRate : "-";
      const breathRate = selectedRadarData ? selectedRadarData.breathRate : "-";
      const distance = selectedRadarData ? selectedRadarData.distance : "-";
      const environmentInterference = selectedRadarData ? selectedRadarData.environmentInterference : "-";

      // 手环状态
      const tamperStatus = braceletData ? braceletData.tamperStatus : null;
      const braceletStatus = getBraceletStatusText(
         {
            heartRate,
            environmentInterference,
            breathRate,
         },
         tamperStatus
      );

      return (
         <Col span={6} key={`${room.id}-${personnelData.id}`}>
            <Card
               bordered={false}
               onClick={() => {
                  setSelectedRoom({
                     roomId: room.id,
                     roomInfo: {
                        name: personnelData.name,
                        age: personnelData.age,
                        gender: personnelData.gender,
                        personnelId: personnelData.id,
                     },
                     associationId,
                     initialSlide: 0,
                  });
               }}
               className={alarms.find((item) => item.personnelId == personnelData.id) ? "alarm-card" : ""}
            >
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                     <h3 style={isUnassigned ? { color: "#999" } : {}}>{roomName}</h3>
                     <div style={{ fontSize: "12px", color: "#888" }}>
                        {showPersonnelName ? personnelData.name : "某"}
                     </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                     <Tag color={getTagInfo(room).color} key={`tag-${room.id}`}>
                        {getTagInfo(room).text}
                     </Tag>
                     {alarms.find((item) => item.roomId === room.id) && (
                        <BellOutlined style={{ color: "red", marginRight: "8px", fontSize: 24 }} />
                     )}
                  </div>
               </div>
               <div
                  style={{
                     display: "flex",
                     justifyContent: "space-between",
                     alignItems: "flex-start",
                     marginTop: 8,
                  }}
               >
                  <Row style={{ width: "100%" }}>
                     <Col span={4}>{getIcon(room)}</Col>
                  </Row>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                     <Button
                        type='link'
                        style={{ padding: 0 }}
                        onClick={(event) => {
                           event.stopPropagation();
                           setSelectedRoom({
                              roomId: room.id,
                              roomInfo: {
                                 name: personnelData.name,
                                 age: personnelData.age,
                                 gender: personnelData.gender,
                                 personnelId: personnelData.id,
                              },
                              associationId,
                              initialSlide: 1,
                           });
                        }}
                     >
                        日曲线
                     </Button>
                     <Button
                        type='link'
                        style={{ padding: 0 }}
                        onClick={(event) => {
                           event.stopPropagation();
                           setSelectedRoom({
                              roomId: room.id,
                              roomInfo: {
                                 name: personnelData.name,
                                 age: personnelData.age,
                                 gender: personnelData.gender,
                                 personnelId: personnelData.id,
                              },
                              associationId,
                              initialSlide: 2,
                           });
                        }}
                     >
                        周曲线
                     </Button>
                  </div>
               </div>
               <Row gutter={16} style={{ marginTop: 16 }}>
                  <Col span={6}>
                     <div style={{ textAlign: "center" }}>
                        <HeartOutlined style={{ fontSize: 27, color: "red" }} />
                        <p style={{ fontSize: 12, fontWeight: "bold", margin: 0 }}>{heartRate} 次</p>
                     </div>
                  </Col>
                  <Col span={6}>
                     <div style={{ textAlign: "center" }}>
                        <img src={"/images/ll.png"} alt='呼吸率图标' style={{ width: 24, height: 24, color: "blue" }} />
                        <p style={{ fontSize: 12, fontWeight: "bold", margin: 0 }}>{breathRate} 次</p>
                     </div>
                  </Col>
                  <Col span={6}>
                     <div style={{ textAlign: "center" }}>
                        <img
                           src={"/images/radar2.png"}
                           alt='雷达图标'
                           style={{ width: 24, height: 24, color: "blue" }}
                        />
                        <p style={{ fontSize: 12, fontWeight: "bold", margin: 0 }}>
                           {distance === "-" || (distance / 100).toFixed(2)}米
                        </p>
                     </div>
                  </Col>
                  <Col span={6}>
                     <div style={{ textAlign: "center" }}>
                        <img
                           src={"/images/radarzzz.png"}
                           alt='干扰图标'
                           style={{ width: 24, height: 24, color: "orange" }}
                        />
                        <p style={{ fontSize: 12, fontWeight: "bold", margin: 0 }}>{environmentInterference}</p>
                     </div>
                  </Col>
               </Row>
               <Row style={{ marginTop: 16 }}>
                  <Col span={24} style={{ textAlign: "center" }}>
                     <p style={{ fontSize: 12, fontWeight: "bold", margin: 0 }}>{braceletStatus}</p>
                  </Col>
               </Row>
            </Card>
         </Col>
      );
   };

   // 定义选项卡内容
   const tabItems = [
      {
         key: "card",
         label: "卡片视图",
         children: (
            <Row gutter={[16, 32]} justify='center' align='middle'>
               {getAllRoomPersonnel().map((roomPersonnel) => renderPersonnelCard(roomPersonnel))}
            </Row>
         ),
      },
      {
         key: "list",
         label: "列表视图",
         children: (
            <Table
               columns={columns}
               dataSource={getAllRoomPersonnel()}
               rowKey={(record) => `${record.room.id}-${record.personnel?.id || "add"}`}
               loading={loading}
               pagination={{ pageSize: 10 }}
            />
         ),
      },
   ];

   // 渲染内容区域
   const renderContent = () => {
      if (selectedRoom) {
         return (
            <RoomPage
               personnelId={selectedRoom.roomInfo.personnelId!}
               roomId={selectedRoom.roomId}
               associationId={selectedRoom.associationId}
               initialSlide={selectedRoom.initialSlide}
            />
         );
      }

      return <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />;
   };

   // 添加获取单个房间信息的逻辑
   useEffect(() => {
      const fetchRoomInfo = async () => {
         if (roomId) {
            try {
               const response = await axios.get(`${config.backend.url}/rooms/${roomId}`);
               setCurrentRoom(response.data);
            } catch (error) {
               console.error("获取房间信息失败:", error);
               message.error("获取房间信息失败");
            }
         } else {
            setCurrentRoom(null);
         }
      };
      fetchRoomInfo();
   }, [roomId]);

   return (
      <div className='new-overview-container'>
         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>{currentRoom ? `${currentRoom.name} 人员` : "人员总览"}</h2>

            {selectedRoom && (
               <Button type='primary' style={{ width: 120, fontSize: 16 }} onClick={() => setSelectedRoom(null)}>
                  返回人员总览
               </Button>
            )}
         </div>
         {renderContent()}

         <ArmPersonnelModal
            visible={isArmModalVisible}
            initialValues={armModalInitValues}
            onCancel={() => setIsArmModalVisible(false)}
            onSubmit={handleArmSubmit}
         />
      </div>
   );
};

export default NewOverview;
