import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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

const DashboardRoutes: React.FC = () => {
   return (
      <Routes>
         {/* legacy NewOverview route removed */}
         <Route path='overview/:roomId?' element={<Overview />} />
         <Route path='history' element={<HistoryData />} />
         <Route path='alarm-display' element={<AlarmDisplay />} />
         <Route path='personnel-management' element={<PersonnelManagement />} />
         <Route path='personnel-management/:id' element={<PersonnelDetails />} />
         <Route path='entry-exit-management' element={<EntryExitManagement />} />
         <Route path='room-management' element={<RoomManagement />} />
         <Route path='room-type-management' element={<RoomTypeManagement />} />
         <Route path='radar-management' element={<RadarManagement />} />
         <Route path='alarm-settings' element={<AlarmSettings />} />
         <Route path='user-management' element={<UserManagement />} />
         <Route path='license-management' element={<LicenseManagement />} />
         <Route path='mini-management' element={<MiniManagement />} />
         <Route path='all-bracelets' element={<AllBracelets />} />
         <Route path='armed-bracelets' element={<ArmedBracelets />} />
         <Route path='assigned-bracelets' element={<AssignedBracelets />} />
         <Route path='unassigned-bracelets' element={<UnassignedBracelets />} />
         <Route path='registration' element={<Registration />} />
         <Route
            path='room/:roomId'
            element={<RoomPage personnelId={null} roomId={1} associationId={""} initialSlide={0} />}
         />
         <Route path='*' element={<Navigate to='../overview' />} />
      </Routes>
   );
};

export default DashboardRoutes;
