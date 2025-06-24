/**
 * 数据处理函数单元测试
 * 由于项目缺少测试依赖，这里提供测试用例结构和手动测试方法
 */

import { getRoomMaxPersonnel, getAllRoomPersonnel, processPersonnelDeviceData } from "../../utils/dataProcessors";
import { Room, Association, Personnel } from "../../types";

// 手动测试函数
export const runDataProcessorsTests = () => {
   console.log("开始数据处理器测试...");

   // 测试数据
   const mockRooms: Room[] = [
      { id: 1, name: "房间1", typeId: 1 },
      { id: 2, name: "房间2", typeId: 2 },
   ];

   const mockAssociations: Association[] = [
      { id: 1, personnelId: 1, braceletId: "B001", roomId: 1, radarIds: ["R001"] },
      { id: 2, personnelId: 2, braceletId: "B002", roomId: 2, radarIds: ["R002"] },
   ];

   const mockPersonnel: Personnel[] = [
      { id: 1, name: "张三", gender: "男", age: 30, id_number: "123456789012345678" },
      { id: 2, name: "李四", gender: "女", age: 25, id_number: "987654321098765432" },
   ];

   const mockRoomTypes = [
      { typeId: 1, typeName: "单人房", templateId: 1 },
      { typeId: 2, typeName: "双人房", templateId: 2 },
   ];

   const mockRoomTemplates = [
      { templateId: 1, maxPersonnel: 1 },
      { templateId: 2, maxPersonnel: 2 },
   ];

   // 测试 getRoomMaxPersonnel
   const maxPersonnel1 = getRoomMaxPersonnel(mockRooms[0], mockRoomTypes, mockRoomTemplates);
   const maxPersonnel2 = getRoomMaxPersonnel(mockRooms[1], mockRoomTypes, mockRoomTemplates);

   console.assert(maxPersonnel1 === 1, "房间1最大人员数应为1");
   console.assert(maxPersonnel2 === 2, "房间2最大人员数应为2");

   // 测试 getAllRoomPersonnel
   const allRoomPersonnel = getAllRoomPersonnel(
      mockRooms,
      mockAssociations,
      mockPersonnel,
      mockRoomTypes,
      mockRoomTemplates
   );

   console.assert(allRoomPersonnel.length >= 2, "应该返回至少2个房间人员数据");
   console.assert(allRoomPersonnel[0].room.id === 1, "第一个应该是房间1的数据");
   console.assert(allRoomPersonnel[0].personnel?.name === "张三", "应该关联到正确的人员");

   // 测试 processPersonnelDeviceData
   const mockPersonDeviceData = {
      1: {
         devices: {
            bracelet: { heartRate: 75, tamperStatus: 0 },
            radar: [{ heartRate: 70, breathRate: 18, distance: 0.5, environmentInterference: 85 }],
         },
      },
   };

   const mockRadars = [{ id: "R001", distance: 100, person_pose: "卧床" }];

   const deviceInfo = processPersonnelDeviceData(1, mockPersonDeviceData, mockRadars);

   console.assert(deviceInfo.heartRate === 75, "应该优先使用手环心率数据");
   console.assert(deviceInfo.breathRate === 18, "应该返回雷达呼吸率数据");
   console.assert(deviceInfo.braceletData.heartRate === 75, "应该包含手环数据");

   console.log("✅ 数据处理器测试完成");
};

// 提供测试用例结构（当有测试框架时使用）
export const dataProcessorsTestCases = {
   getRoomMaxPersonnel: {
      应该返回正确的房间最大人员数: () => {
         // 测试逻辑
      },
      应该处理不存在的房间类型: () => {
         // 测试逻辑
      },
   },
   getAllRoomPersonnel: {
      应该正确合并房间和人员数据: () => {
         // 测试逻辑
      },
      应该按类型排序数据: () => {
         // 测试逻辑
      },
   },
   processPersonnelDeviceData: {
      应该优先使用手环数据: () => {
         // 测试逻辑
      },
      应该处理过期数据: () => {
         // 测试逻辑
      },
   },
};
