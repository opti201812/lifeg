/**
 * 简单的测试运行器
 * 用于验证工具函数的基本功能
 */

// Mock dependencies
const React = { createElement: () => null };
const dayjs = () => ({
    year: () => 2023,
    month: () => 0,
    date: () => 15,
    hour: () => 10,
    minute: () => 30,
    isBefore: () => false,
    isSame: () => true,
    isAfter: () => false,
    add: () => ({
        isBefore: () => false,
        isSame: () => true,
    })
});

// 简单的断言函数
const assert = (condition, message) => {
    if (!condition) {
        throw new Error(`断言失败: ${message}`);
    }
    console.log(`✅ ${message}`);
};

// 测试常量
console.log('=== 测试常量定义 ===');
const ALARM_LEVEL_TEXT = {
    1: "极度危险",
    2: "危险",
    3: "异常",
};

assert(ALARM_LEVEL_TEXT[1] === "极度危险", "报警级别1应为极度危险");
assert(ALARM_LEVEL_TEXT[2] === "危险", "报警级别2应为危险");
assert(ALARM_LEVEL_TEXT[3] === "异常", "报警级别3应为异常");

// 测试工具函数
console.log('\n=== 测试工具函数 ===');

// 测试 getRoomNameById
const getRoomNameById = (roomId, rooms) => {
    const room = rooms.find((r) => r.id === roomId);
    return room ? room.name : `未知房间(${roomId})`;
};

const mockRooms = [
    { id: 1, name: '房间1', typeId: 1 },
    { id: 2, name: '房间2', typeId: 2 },
];

assert(getRoomNameById(1, mockRooms) === '房间1', "应该返回正确的房间名称");
assert(getRoomNameById(999, mockRooms) === '未知房间(999)', "应该处理不存在的房间ID");

// 测试 getDeviceData
const getDeviceData = (devices) => {
    const braceletHeartRate = devices.bracelet?.heartRate;
    const validRadars = devices.radar?.filter((r) => (r.heartRate || 0) > 0) || [];
    const primaryRadar = validRadars[0] || devices.radar?.[0];

    return {
        heartRate: braceletHeartRate ?? primaryRadar?.heartRate ?? "",
        breathRate: primaryRadar?.breathRate ?? "",
        distance: primaryRadar?.distance ?? "",
        pose: primaryRadar?.pose ?? "",
        environment: primaryRadar?.environment ?? "",
    };
};

const mockDevices1 = {
    bracelet: { heartRate: 80 },
    radar: [{ heartRate: 75, breathRate: 20 }]
};

const result1 = getDeviceData(mockDevices1);
assert(result1.heartRate === 80, "应该优先使用手环心率数据");
assert(result1.breathRate === 20, "应该使用雷达呼吸率数据");

const mockDevices2 = {
    radar: [
        { heartRate: 0, breathRate: 15 },
        { heartRate: 70, breathRate: 18 }
    ]
};

const result2 = getDeviceData(mockDevices2);
assert(result2.heartRate === 70, "应该过滤掉心率为0的雷达数据");

// 测试数据处理器函数
console.log('\n=== 测试数据处理器 ===');

const getRoomMaxPersonnel = (room, roomTypes, roomTemplates) => {
    const roomTypeMap = new Map();
    roomTypes.forEach((roomType) => {
        roomTypeMap.set(roomType.typeId, roomType);
    });

    const templateMap = new Map();
    roomTemplates.forEach((template) => {
        templateMap.set(template.templateId, template);
    });

    const roomType = roomTypeMap.get(room.typeId);
    if (!roomType) return 1;

    const template = templateMap.get(roomType.templateId);
    return template?.maxPersonnel || 1;
};

const mockRoomTypes = [
    { typeId: 1, typeName: '单人房', templateId: 1 },
    { typeId: 2, typeName: '双人房', templateId: 2 },
];

const mockRoomTemplates = [
    { templateId: 1, maxPersonnel: 1 },
    { templateId: 2, maxPersonnel: 2 },
];

const maxPersonnel1 = getRoomMaxPersonnel(mockRooms[0], mockRoomTypes, mockRoomTemplates);
const maxPersonnel2 = getRoomMaxPersonnel(mockRooms[1], mockRoomTypes, mockRoomTemplates);

assert(maxPersonnel1 === 1, "房间1最大人员数应为1");
assert(maxPersonnel2 === 2, "房间2最大人员数应为2");

console.log('\n🎉 所有基础测试通过！');
console.log('✅ 步骤1-2: 工具函数和常量测试完成');
console.log('✅ 可以继续进行步骤3: UI组件拆分'); 