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
                  key: "overview",
                  label: "人员总览",
                  icon: <UserOutlined />,
               },
               {
                  key: "new-overview",
                  label: "旧版总览",
                  icon: <UserOutlined />,
               },
               ...Object.values(roomsByType)
                  .flat()
                  .map((room) => ({
                     key: `room-${room.id}`,
                     label: room.name,
                     icon: <HomeOutlined />,
                  })),
               {
                  key: "all-bracelets",
                  label: "全部手环",
                  icon: <WifiOutlined />,
                  children: [
                     {
                        key: "armed-bracelets",
                        label: "已设防手环",
                        icon: <WifiOutlined />,
                     },
                     {
                        key: "assigned-bracelets",
                        label: "已分配手环",
                        icon: <WifiOutlined />,
                     },
                     {
                        key: "unassigned-bracelets",
                        label: "未分配手环",
                        icon: <WifiOutlined />,
                     },
                  ],
               },
               {
                  key: "registration",
                  label: "检录",
                  icon: <UserOutlined />,
               },
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
