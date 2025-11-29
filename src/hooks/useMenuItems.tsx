import React, { useMemo } from "react";
import {
   UserOutlined,
   AlertOutlined,
   DashboardOutlined,
   HistoryOutlined,
   SettingOutlined,
   AppstoreOutlined,
   HomeOutlined,
   WifiOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const useMenuItems = (
   roomTypes: { typeId: number; typeName: string }[],
   roomsByType: { [key: string]: { id: number; name: string }[] }
) => {
   const navigate = useNavigate();

   return useMemo(() => {
      return [
         {
            key: "rooms",
            icon: <HomeOutlined />,
            label: "房间总览",
            children: [
               {
                  key: "new-overview",
                  label: "人员总览",
                  icon: <UserOutlined />,
               },
               ...Object.values(roomsByType)
                  .flat()
                  .map((room) => ({
                     key: `room-${room.id}`,
                     label: room.name,
                     icon: <HomeOutlined />,
                  })),
            ],
         },
         { key: "history", icon: <HistoryOutlined />, label: "历史数据" },
         { key: "alarm-display", icon: <AlertOutlined />, label: "报警分析" },
         {
            key: "personnel-management",
            icon: <UserOutlined />,
            label: "人员管理",
         },
         {
            key: "settings",
            icon: <SettingOutlined />,
            label: "系统配置",
            children: [
               {
                  key: "room-config",
                  icon: <HomeOutlined />,
                  label: "房间配置",
                  children: [
                     { key: "room-management", label: "房间管理" },
                     { key: "room-type-management", label: "类型管理" },
                     { key: "radar-management", label: "雷达管理" },
                  ],
               },
               { key: "alarm-settings", icon: <UserOutlined />, label: "报警配置" },
               { key: "user-management", icon: <UserOutlined />, label: "权限管理" },
               {
                  key: "license-management",
                  icon: <UserOutlined />,
                  label: "软件许可",
               },
            ],
         },
      ];
   }, [navigate, roomTypes, roomsByType]);
};

export default useMenuItems;
