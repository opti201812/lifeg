import axios from "axios";
import config from "../../../config";
import {
   RegistrationRecord,
   PersonnelData,
   AssociationData,
   BraceletResponse,
   OximeterResponse,
   OximeterConfigResponse,
   BraceletDevice,
   OximeterDevice,
} from "../types";
import {
   normalizeArray,
   buildRegistrationRecords,
   getAvailableBraceletIds,
   getAvailableOximeterIds,
   buildPersonnelPayload,
   buildAssociationPayload,
   findBraceletDevice,
   findOximeterDevice,
} from "../utils";

/**
 * 获取可用手环列表（未分配的手环）
 */
export const fetchAvailableBraceletIds = async (): Promise<string[]> => {
   try {
      const [braceletResponse, associationsResponse] = await Promise.all([
         axios.get(`${config.backend.url}/rooms/bracelets`),
         axios.get(`${config.backend.url}/associations`),
      ]);

      const braceletData = braceletResponse.data?.data || braceletResponse.data || ({} as BraceletResponse);
      const associations = normalizeArray(associationsResponse.data?.data || associationsResponse.data) as AssociationData[];

      return getAvailableBraceletIds(braceletData, associations);
   } catch (error) {
      console.error("获取可用手环失败:", error);
      throw error;
   }
};

/**
 * 获取可用血氧仪列表
 */
export const fetchAvailableOximeterIds = async (): Promise<string[]> => {
   try {
      const oximeterResponse = await axios.get(`${config.backend.url}/v1/oximeter-status/config`);

      const oximeterData = oximeterResponse.data || ({} as OximeterConfigResponse);

      return getAvailableOximeterIds(oximeterData);
   } catch (error) {
      console.error("获取可用血氧仪失败:", error);
      return [];
   }
};

/**
 * 获取手环设备数据（用于自动填充表单）
 */
export const fetchBraceletData = async (braceletId: string): Promise<BraceletDevice | null> => {
   try {
      const response = await axios.get(`${config.backend.url}/rooms/bracelets`);
      const braceletData = response.data || ({} as BraceletResponse);
      return findBraceletDevice(braceletId, braceletData);
   } catch (error) {
      console.error("获取手环数据失败:", error);
      return null;
   }
};

/**
 * 获取血氧仪设备数据（用于自动填充表单）
 */
export const fetchOximeterData = async (oximeterId: string): Promise<OximeterDevice | null> => {
   try {
      const response = await axios.get(`${config.backend.url}/v1/oximeter-status/config`);
      const oximeterData = response.data || ({} as OximeterResponse);
      return findOximeterDevice(oximeterId, oximeterData);
   } catch (error) {
      console.error("获取血氧仪数据失败:", error);
      return null;
   }
};

/**
 * 连接血氧仪设备（直接连接）
 * @param deviceId 设备ID
 * @param deviceName 设备名称（如 "BerryMed"）
 * @param deviceAddress 设备地址（MAC 地址）
 */
export const connectOximeterDevice = async (
   deviceId: string,
   deviceName: string = "BerryMed",
   deviceAddress: string = ""
): Promise<boolean> => {
   try {
      const response = await axios.post(
         `${config.backend.url}/v1/oximeter-status/device/${deviceId}/connect-directly`,
         { deviceName, deviceAddress }
      );
      console.log("[连接血氧仪] 响应:", response.data);
      return response.data?.success === true;
   } catch (error) {
      console.error("连接血氧仪失败:", error);
      return false;
   }
};

/**
 * 获取血氧仪配置信息
 */
export const fetchOximeterConfig = async () => {
   try {
      const response = await axios.get(`${config.backend.url}/v1/oximeter-status/config`);
      return response.data;
   } catch (error) {
      console.error("获取血氧仪配置失败:", error);
      return null;
   }
};

/**
 * 获取检录记录列表
 */
export const fetchRegistrationRecordsList = async (): Promise<RegistrationRecord[]> => {
   try {
      const [personnelResponse, associationsResponse] = await Promise.all([
         axios.get(`${config.backend.url}/personnel`),
         axios.get(`${config.backend.url}/associations`),
      ]);

      const personnelList = normalizeArray(personnelResponse.data?.data || personnelResponse.data) as PersonnelData[];
      const associations = normalizeArray(associationsResponse.data?.data || associationsResponse.data) as AssociationData[];

      return buildRegistrationRecords(personnelList, associations);
   } catch (error) {
      console.error("获取检录记录失败:", error);
      throw error;
   }
};

/**
 * 新增检录（创建人员和关联）
 * @param values 表单值
 * @param onAskContinueWearingOximeter 询问用户是否持续佩戴血氧仪的回调函数
 */
export const createRegistration = async (
   values: any,
   onAskContinueWearingOximeter?: () => Promise<boolean>,
): Promise<void> => {
   const personnelPayload = buildPersonnelPayload(values);
   const associationPayload = buildAssociationPayload(values);

   const hasBracelet = !!values.braceletId;
   let hasOximeter = !!values.oximeterId;

   // 1. 如果连接了血氧仪，询问是否持续佩戴
   if (hasOximeter && onAskContinueWearingOximeter) {
      const willContinueWearing = await onAskContinueWearingOximeter();
      if (!willContinueWearing) {
         // 用户不持续佩戴，则不关联血氧仪
         hasOximeter = false;
         associationPayload.oximeterId = null;
      }
   }

   // 2. 创建人员
   const personnelRes = await axios.post(`${config.backend.url}/personnel`, personnelPayload);
   const newPersonnelId = personnelRes.data?.id;

   if (!newPersonnelId) {
      throw new Error("人员ID获取失败");
   }

   // 3. 如果有设备，则创建关联
   if (hasBracelet || hasOximeter) {
      await axios.post(`${config.backend.url}/associations`, {
         ...associationPayload,
         personnelId: newPersonnelId,
      });
   }
};

/**
 * 更新检录（更新人员和关联）
 */
export const updateRegistration = async (record: RegistrationRecord, values: any): Promise<void> => {
   const personnelPayload = buildPersonnelPayload(values);
   const associationPayload = buildAssociationPayload(values);

   const hasBracelet = !!values.braceletId;
   const hasOximeter = !!values.oximeterId;
   const personnelId = record.personnelId || Number(record.id);

   // 1. 更新人员
   await axios.put(`${config.backend.url}/personnel/${personnelId}`, personnelPayload);

   // 2. 处理关联逻辑
   const hasExistingAssociation = !!record.associationId;
   const shouldHaveAssociation = hasBracelet || hasOximeter;

   if (hasExistingAssociation) {
      if (shouldHaveAssociation) {
         // 更新关联
         await axios.put(`${config.backend.url}/associations/${record.associationId}`, {
            ...associationPayload,
            personnelId,
         });
      } else {
         // 删除关联
         await axios.delete(`${config.backend.url}/associations/${record.associationId}`);
      }
   } else if (shouldHaveAssociation) {
      // 创建关联
      await axios.post(`${config.backend.url}/associations`, {
         ...associationPayload,
         personnelId,
      });
   }
};

/**
 * 删除检录（删除关联和人员）
 */
export const deleteRegistration = async (record: RegistrationRecord): Promise<void> => {
   // 1. 删除关联（如果存在）
   if (record.associationId) {
      await axios.delete(`${config.backend.url}/associations/${record.associationId}`);
   }

   // 2. 删除人员
   await axios.delete(`${config.backend.url}/personnel/${record.personnelId || record.id}`);
};
