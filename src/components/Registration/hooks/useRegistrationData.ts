import { useState, useCallback } from "react";
import { message } from "antd";
import { RegistrationRecord } from "../types";
import {
   fetchAvailableBraceletIds,
   fetchAvailableOximeterIds,
   fetchBraceletData,
   fetchOximeterData,
   fetchRegistrationRecordsList,
   createRegistration,
   updateRegistration,
   deleteRegistration,
} from "../services/registrationService";

/**
 * 检录数据管理 Hook
 */
export const useRegistrationData = () => {
   const [loading, setLoading] = useState(false);
   const [tableLoading, setTableLoading] = useState(false);
   const [registrationRecords, setRegistrationRecords] = useState<RegistrationRecord[]>([]);
   const [availableBracelets, setAvailableBracelets] = useState<string[]>([]);
   const [availableOximeters, setAvailableOximeters] = useState<string[]>([]);

   // 获取可用手环
   const loadAvailableBracelets = useCallback(async () => {
      try {
         const ids = await fetchAvailableBraceletIds();
         setAvailableBracelets(ids);
      } catch (error) {
         console.error("获取可用手环失败:", error);
         message.error("获取可用手环列表失败");
      }
   }, []);

   // 获取可用血氧仪
   const loadAvailableOximeters = useCallback(async () => {
      try {
         const ids = await fetchAvailableOximeterIds();
         setAvailableOximeters(ids);
      } catch (error) {
         console.error("获取可用血氧仪失败:", error);
         // 血氧仪 API 可能未实现，不提示错误
      }
   }, []);

   // 获取检录记录
   const loadRegistrationRecords = useCallback(async () => {
      setTableLoading(true);
      try {
         const records = await fetchRegistrationRecordsList();
         setRegistrationRecords(records);
      } catch (error) {
         console.error("获取检录记录失败:", error);
         message.error("获取检录记录失败");
         setRegistrationRecords([]);
      } finally {
         setTableLoading(false);
      }
   }, []);

   // 刷新所有数据
   const refreshAllData = useCallback(async () => {
      await Promise.all([loadRegistrationRecords(), loadAvailableBracelets(), loadAvailableOximeters()]);
   }, [loadRegistrationRecords, loadAvailableBracelets, loadAvailableOximeters]);

   // 新增检录
   const handleCreate = useCallback(
      async (values: any, onAskContinueWearingOximeter?: () => Promise<boolean>) => {
         try {
            setLoading(true);
            await createRegistration(values, onAskContinueWearingOximeter);
            message.success("检录成功");
            await refreshAllData();
            return true;
         } catch (error: any) {
            console.error("新增检录失败:", error);
            message.error(error.response?.data?.error || error.message || "检录失败，请重试");
            return false;
         } finally {
            setLoading(false);
         }
      },
      [refreshAllData]
   );

   // 更新检录
   const handleUpdate = useCallback(
      async (record: RegistrationRecord, values: any) => {
         try {
            setLoading(true);
            await updateRegistration(record, values);
            message.success("检录记录更新成功");
            await refreshAllData();
            return true;
         } catch (error: any) {
            console.error("更新检录失败:", error);
            message.error(error.response?.data?.error || error.message || "检录失败，请重试");
            return false;
         } finally {
            setLoading(false);
         }
      },
      [refreshAllData]
   );

   // 删除检录
   const handleDelete = useCallback(
      async (record: RegistrationRecord) => {
         try {
            setLoading(true);
            await deleteRegistration(record);
            message.success("删除成功");
            await refreshAllData();
            return true;
         } catch (error: any) {
            console.error("删除检录失败:", error);
            message.error("删除失败");
            return false;
         } finally {
            setLoading(false);
         }
      },
      [refreshAllData]
   );

   // 获取手环数据并填充表单（用于手环选择时）
   const loadBraceletDataForForm = useCallback(async (braceletId: string) => {
      return await fetchBraceletData(braceletId);
   }, []);

   // 获取血氧仪数据并填充表单（用于血氧仪连接时）
   const loadOximeterDataForForm = useCallback(async (oximeterId: string) => {
      return await fetchOximeterData(oximeterId);
   }, []);

   return {
      // 状态
      registrationRecords,
      availableBracelets,
      availableOximeters,
      loading,
      tableLoading,

      // 数据加载
      loadAvailableBracelets,
      loadAvailableOximeters,
      loadRegistrationRecords,
      loadBraceletDataForForm,
      loadOximeterDataForForm,
      refreshAllData,

      // 操作
      handleCreate,
      handleUpdate,
      handleDelete,
   };
};
