import { useState, useCallback } from "react";
import { FormInstance } from "antd";
import { RegistrationRecord } from "../types";

/**
 * 检录 Modal 状态管理 Hook
 */
export const useRegistrationModal = (form: FormInstance) => {
   const [isModalVisible, setIsModalVisible] = useState(false);
   const [editingRecord, setEditingRecord] = useState<RegistrationRecord | null>(null);
   const [oximeterEnabled, setOximeterEnabled] = useState(false);
   const [braceletEnabled, setBraceletEnabled] = useState(false);
   const [oximeterId, setOximeterId] = useState<string | null>(null);
   const [braceletId, setBraceletId] = useState<string | null>(null);
   const [pendingRecord, setPendingRecord] = useState<RegistrationRecord | null>(null);

   const openModal = useCallback(
      (record?: RegistrationRecord) => {
         if (record) {
            setEditingRecord(record);
            setPendingRecord(record);
            setOximeterEnabled(!!record.oximeterId);
            setBraceletEnabled(!!record.braceletId);
            setOximeterId(record.oximeterId || null);
            setBraceletId(record.braceletId || null);
         } else {
            setEditingRecord(null);
            setPendingRecord(null);
            form.resetFields();
            setOximeterEnabled(false);
            setBraceletEnabled(false);
            setOximeterId(null);
            setBraceletId(null);
         }
         setIsModalVisible(true);
      },
      [form]
   );

   const closeModal = useCallback(() => {
      setIsModalVisible(false);
      setEditingRecord(null);
      setPendingRecord(null);
      form.resetFields();
      setOximeterEnabled(false);
      setBraceletEnabled(false);
      setOximeterId(null);
      setBraceletId(null);
   }, [form]);

   const toggleOximeterConnection = useCallback((deviceId?: string) => {
      setOximeterEnabled((prev) => {
         if (prev) {
            form.setFieldsValue({ oximeterId: undefined });
            setOximeterId(null);
         } else if (deviceId) {
            form.setFieldsValue({ oximeterId: deviceId });
            setOximeterId(deviceId);
         }
         return !prev;
      });
   }, [form]);

   const toggleBraceletConnection = useCallback((deviceId?: string) => {
      setBraceletEnabled((prev) => {
         if (prev) {
            form.setFieldsValue({ braceletId: undefined });
            setBraceletId(null);
         } else if (deviceId) {
            form.setFieldsValue({ braceletId: deviceId });
            setBraceletId(deviceId);
         }
         return !prev;
      });
   }, [form]);

   return {
      isModalVisible,
      editingRecord,
      oximeterEnabled,
      braceletEnabled,
      pendingRecord,
      oximeterId,
      braceletId,

      openModal,
      closeModal,
      toggleOximeterConnection,
      toggleBraceletConnection,
   };
};
