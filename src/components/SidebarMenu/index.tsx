import React, { useEffect, useMemo } from "react";
import { Menu } from "antd";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import config from "../../config";
import useMenuItems from "../../hooks/useMenuItems";
import { setRooms, setRoomTypes } from "../../store/dataSlice";
import { RootState } from "../../store";
import { theme } from "../../styles/theme";

const SidebarMenu: React.FC = () => {
   const navigate = useNavigate();
   const dispatch = useDispatch();

   // 从 redux 读取房间与类型，作为单一数据源
   const rooms = useSelector((state: RootState) => state.data.rooms);
   const roomTypes = useSelector((state: RootState) => state.data.roomTypes);

   // 兜底初始化：redux 中房间/类型为空时从后端拉取一次并写入 redux，
   // 之后依赖管理页 dispatch(setRooms/setRoomTypes) 保持实时同步
   useEffect(() => {
      if (rooms.length === 0) {
         const fetchRooms = async () => {
            try {
               const response = await axios.get(`${config.backend.url}/rooms`);
               dispatch(setRooms(response.data?.data || response.data || []));
            } catch (error) {
               console.error("获取房间失败:", error);
            }
         };
         fetchRooms();
      }
   }, [rooms.length, dispatch]);

   useEffect(() => {
      if (roomTypes.length === 0) {
         const fetchRoomTypes = async () => {
            try {
               const response = await axios.get(`${config.backend.url}/rooms/types`);
               dispatch(setRoomTypes(response.data?.data || response.data || []));
            } catch (error) {
               console.error("获取房间类型失败:", error);
            }
         };
         fetchRoomTypes();
      }
   }, [roomTypes.length, dispatch]);

   // 按类型分组房间
   const roomsByType = useMemo(() => {
      const grouped: { [key: string]: { id: number; name: string }[] } = {};
      roomTypes.forEach((type: { typeId: number; typeName: string }) => {
         grouped[type.typeId.toString()] = rooms
            .filter((room: any) => room.typeId === type.typeId)
            .map((room: any) => ({ id: room.id, name: room.name }));
      });
      return grouped;
   }, [rooms, roomTypes]);

   const menuItems = useMenuItems(roomTypes, roomsByType);

   const handleMenuClick = ({ key }: { key: string }) => {
      if (key === "logout") {
         // 退出登录逻辑在MainLayout中处理
      } else if (key === "room-management") {
         navigate("/dashboard/room-management");
      } else if (key === "room-type-management") {
         navigate("/dashboard/room-type-management");
      } else if (key === "radar-management") {
         navigate("/dashboard/radar-management");
      } else if (key === "assigned-bracelets") {
         navigate("/dashboard/assigned-bracelets");
      } else if (key === "unassigned-bracelets") {
         navigate("/dashboard/unassigned-bracelets");
      } else if (key === "all-bracelets") {
         navigate("/dashboard/all-bracelets");
      } else if (key === "registration") {
         navigate("/dashboard/registration");
      } else if (key.startsWith("room-")) {
         const roomId = key.split("-")[1];
         navigate(`/dashboard/overview/${roomId}`);
      } else {
         navigate(`/dashboard/${key}`);
      }
   };

   return (
      <Menu
         theme='dark'
         mode='inline'
         defaultSelectedKeys={["overview"]}
         items={menuItems}
         onClick={handleMenuClick}
         style={{
            height: "100%", // 确保菜单填充整个侧边栏
            borderRight: 0,
            background: theme.menuBackgroundColor,
         }}
      />
   );
};

export default SidebarMenu;