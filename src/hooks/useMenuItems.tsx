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
   RightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

interface RoomMenuOptions {
   /** 房间列表是否折叠（为 true 时隐藏房间项，仅显示折叠头） */
   roomsCollapsed?: boolean;
}

const useMenuItems = (
   roomTypes: { typeId: number; typeName: string }[],
   roomsByType: { [key: string]: { id: number; name: string }[] },
   options?: RoomMenuOptions
) => {
   const navigate = useNavigate();
   const { roomsCollapsed = false } = options ?? {};

   return useMemo(() => {
      const rooms = Object.values(roomsByType).flat();

      // 折叠头：房间数大于 0 时显示，点击切换折叠（由 SidebarMenu 处理，不导航）
      const roomsCollapseHeader =
         rooms.length > 0
            ? [
                 {
                    key: "rooms-collapse",
                    icon: <AppstoreOutlined />,
                    label: (
                       <span
                          style={{
                             display: "flex",
                             alignItems: "center",
                             gap: 6,
                             width: "100%",
                          }}
                       >
                          <span>房间列表</span>
                          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                             ({rooms.length})
                          </span>
                          <RightOutlined
                             style={{
                                fontSize: 10,
                                marginLeft: "auto",
                                transition: "transform 0.2s",
                                transform: roomsCollapsed
                                   ? "rotate(0deg)"
                                   : "rotate(90deg)",
                             }}
                          />
                       </span>
                    ),
                 },
              ]
            : [];

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
               // 旧版总览已移除
               ...roomsCollapseHeader,
               ...(roomsCollapsed
                  ? []
                  : rooms.map((room) => ({
                       key: `room-${room.id}`,
                       label: room.name,
                       icon: <HomeOutlined />,
                    }))),
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
   }, [navigate, roomTypes, roomsByType, roomsCollapsed]);
};

export default useMenuItems;
