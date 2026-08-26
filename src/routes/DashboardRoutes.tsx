import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import Overview from "../components/Overview";
import HistoryData from "../components/HistoryData";
import AlarmDisplay from "../components/AlarmDisplay";
import PersonnelManagement from "../components/PersonnelManagement";
import PersonnelDetails from "../components/PersonnelManagement/PersonnelDetails";
import EntryExitManagement from "../components/EntryExitManagement";
import RoomManagement from "../components/RoomManagement";
import RoomTypeManagement from "../components/RoomTypeManagement";
import RadarManagement from "../components/RadarManagement";
import AlarmSettings from "../components/AlarmSettings";
import UserManagement from "../components/UserManagement";
import LicenseManagement from "../components/LicenseManagment";
import MiniManagement from "../components/MiniManagement";
import UnassignedBracelets from "../components/UnassignedBracelets";
import AssignedBracelets from "../components/AssignedBracelets";
import AllBracelets from "../components/AllBracelets";
import Registration from "../components/Registration";
import RoomPage from "../pages/Room";
import ArmedBracelets from "../components/ArmedBracelets";

/** 仅 admin 可访问的页面守卫；user 访问会被重定向回人员总览 */
const AdminOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
   <ProtectedRoute allowedRoles={["admin"]}>{children}</ProtectedRoute>
);

const DashboardRoutes: React.FC = () => {
   return (
      <Routes>
         {/* 人员总览：user 与 admin 均可访问（user 只展示自己房间数据，见 Overview 内过滤） */}
         <Route path='overview/:roomId?' element={<Overview />} />
         {/* 其余管理页面：仅 admin 可访问 */}
         <Route path='history' element={<AdminOnly><HistoryData /></AdminOnly>} />
         <Route path='alarm-display' element={<AdminOnly><AlarmDisplay /></AdminOnly>} />
         <Route path='personnel-management' element={<AdminOnly><PersonnelManagement /></AdminOnly>} />
         <Route path='personnel-management/:id' element={<AdminOnly><PersonnelDetails /></AdminOnly>} />
         <Route path='entry-exit-management' element={<AdminOnly><EntryExitManagement /></AdminOnly>} />
         <Route path='room-management' element={<AdminOnly><RoomManagement /></AdminOnly>} />
         <Route path='room-type-management' element={<AdminOnly><RoomTypeManagement /></AdminOnly>} />
         <Route path='radar-management' element={<AdminOnly><RadarManagement /></AdminOnly>} />
         <Route path='alarm-settings' element={<AdminOnly><AlarmSettings /></AdminOnly>} />
         <Route path='user-management' element={<AdminOnly><UserManagement /></AdminOnly>} />
         <Route path='license-management' element={<AdminOnly><LicenseManagement /></AdminOnly>} />
         <Route path='mini-management' element={<AdminOnly><MiniManagement /></AdminOnly>} />
         <Route path='all-bracelets' element={<AdminOnly><AllBracelets /></AdminOnly>} />
         <Route path='armed-bracelets' element={<AdminOnly><ArmedBracelets /></AdminOnly>} />
         <Route path='assigned-bracelets' element={<AdminOnly><AssignedBracelets /></AdminOnly>} />
         <Route path='unassigned-bracelets' element={<AdminOnly><UnassignedBracelets /></AdminOnly>} />
         <Route path='registration' element={<AdminOnly><Registration /></AdminOnly>} />
         <Route
            path='room/:roomId'
            element={<AdminOnly><RoomPage personnelId={null} roomId={1} associationId={""} initialSlide={0} /></AdminOnly>}
         />
         <Route path='*' element={<Navigate to='../overview' />} />
      </Routes>
   );
};

export default DashboardRoutes;
