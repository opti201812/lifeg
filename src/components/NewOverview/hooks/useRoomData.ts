import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../store";
import { message } from "antd";
import axios from "axios";
import config from "../../../config";
import {
   setRooms,
   setRadars,
   setPersonnel,
   setAssociations,
   setRoomTemplates,
   setRoomTypes,
} from "../../../store/dataSlice";
import { Room } from "../types";

/**
 * 房间数据管理hook
 */
export const useRoomData = () => {
   const [loading, setLoading] = useState(false);
   const [showPersonnelName, setShowPersonnelName] = useState(false);
   const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

   const dispatch = useDispatch();

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

         // 获取雷达数据
         const radarsResponse = await axios.get(`${config.backend.url}/rooms/radars`);
         const radarsData = radarsResponse.data || [];

         // 获取房间初始化数据（包含roomTypes和templates）
         const initDataResponse = await axios.get(`${config.backend.url}/rooms/init-data/`);
         const initData = initDataResponse.data;

         if (initData.success) {
            const roomTypesData = initData.data.roomTypes || [];
            const templatesData = initData.data.templates || [];

            // 更新Redux store
            dispatch(setRooms(roomsData));
            dispatch(setPersonnel(personnelData));
            dispatch(setAssociations(associationsData));
            dispatch(setRadars(radarsData));
            dispatch(setRoomTypes(roomTypesData));
            dispatch(setRoomTemplates(templatesData));
         }

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

   // 获取单个房间信息
   const fetchRoomInfo = useCallback(async (roomId: string) => {
      try {
         const response = await axios.get(`${config.backend.url}/rooms/${roomId}`);
         setCurrentRoom(response.data);
      } catch (error) {
         console.error("获取房间信息失败:", error);
         message.error("获取房间信息失败");
      }
   }, []);

   return {
      loading,
      showPersonnelName,
      currentRoom,
      fetchData,
      fetchRoomInfo,
      setCurrentRoom,
   };
};
