import React, { useEffect, useState, useCallback } from "react";
import { Menu } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../../config";
import useMenuItems from "../../hooks/useMenuItems";
import { theme } from "../../styles/theme";

const SidebarMenu: React.FC = () => {
   const navigate = useNavigate();
   const [roomTypes, setRoomTypes] = useState<{ typeId: number; typeName: string }[]>([]);
   const [roomsByType, setRoomsByType] = useState<{ [key: string]: { id: number; name: string }[] }>({});

   useEffect(() => {
      const fetchRoomTypesAndRooms = async () => {
         try {
            // 获取房间类型
            const roomTypesResponse = await axios.get(`${config.backend.url}/rooms/types`);
            const roomTypesData = roomTypesResponse.data || [];
            setRoomTypes(roomTypesData);

            // 获取所有房间
            const roomsResponse = await axios.get(`${config.backend.url}/rooms`);
            const roomsData = roomsResponse.data || [];

            // 按类型分组房间
            const roomsGroupedByType: { [key: string]: { id: number; name: string }[] } = {};

            roomTypesData.forEach((type: { typeId: number; typeName: string }) => {
               const roomsOfType = roomsData
                  .filter((room: any) => room.typeId === type.typeId)
                  .map((room: any) => ({ id: room.id, name: room.name }));

               roomsGroupedByType[type.typeId.toString()] = roomsOfType;
            });

            setRoomsByType(roomsGroupedByType);
         } catch (error) {
            console.error("获取房间类型和房间失败:", error);
         }
      };

      fetchRoomTypesAndRooms();
   }, []);

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
      } else if (key.startsWith("room-")) {
         const roomId = key.split("-")[1];
         navigate(`/dashboard/new-overview/${roomId}`);
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
