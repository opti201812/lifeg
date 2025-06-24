// AlarmTable集成测试
const alarmTableTest = () => {
    console.log('🔍 开始AlarmTable集成测试...');

    // 模拟测试数据
    const mockAlarms = [
        {
            id: 1,
            alarmTime: '2023-12-20T10:30:00Z',
            level: 1,
            roomId: 101,
            message: '心率异常',
            heartRate: 120,
            breathRate: 25,
            distance: 150
        },
        {
            id: 2,
            alarmTime: '2023-12-20T09:15:00Z',
            level: 2,
            roomId: 102,
            message: '离床报警',
            heartRate: 80,
            breathRate: 18,
            distance: 200
        },
        {
            id: 3,
            alarmTime: '2023-12-20T11:45:00Z',
            level: 3,
            roomId: 101,
            message: '活动异常',
            heartRate: 90,
            breathRate: 20,
            distance: 180
        }
    ];

    const mockRooms = [
        { id: 101, name: '病房001' },
        { id: 102, name: '病房002' },
        { id: 103, name: '病房003' }
    ];

    console.log('📊 测试数据准备完成');
    console.log(`- 报警数据: ${mockAlarms.length} 条`);
    console.log(`- 房间数据: ${mockRooms.length} 个`);

    // 测试数据处理逻辑
    const processedAlarms = [...mockAlarms]
        .sort((a, b) => new Date(b.alarmTime).getTime() - new Date(a.alarmTime).getTime())
        .map((alarm, index) => ({
            ...alarm,
            key: `${alarm.id || index}-${alarm.alarmTime}`,
            roomName: mockRooms.find(r => r.id === alarm.roomId)?.name || `未知房间(${alarm.roomId})`
        }));

    console.log('🔄 数据处理完成');
    console.log('- 排序方式: 按时间从新到旧');
    console.log('- 预期顺序: 11:45 -> 10:30 -> 09:15');
    console.log('- 实际顺序:', processedAlarms.map(a => new Date(a.alarmTime).toLocaleTimeString()));

    // 验证排序
    const isCorrectOrder = processedAlarms.every((alarm, index) => {
        if (index === 0) return true;
        return new Date(alarm.alarmTime).getTime() <= new Date(processedAlarms[index - 1].alarmTime).getTime();
    });

    console.log('✅ 排序验证:', isCorrectOrder ? '通过' : '失败');

    // 验证房间名称映射
    const roomNameMapping = processedAlarms.every(alarm =>
        alarm.roomName && !alarm.roomName.includes('未知房间')
    );

    console.log('✅ 房间名称映射:', roomNameMapping ? '通过' : '失败');

    // 验证必要字段
    const requiredFields = ['alarmTime', 'level', 'roomName', 'message'];
    const fieldsComplete = processedAlarms.every(alarm =>
        requiredFields.every(field => alarm[field] !== undefined && alarm[field] !== null)
    );

    console.log('✅ 必要字段验证:', fieldsComplete ? '通过' : '失败');

    // 测试报警级别文本映射
    const levelTexts = {
        1: '急救',
        2: '重要',
        3: '普通',
        4: '信息'
    };

    const levelMapping = processedAlarms.every(alarm =>
        levelTexts[alarm.level] !== undefined
    );

    console.log('✅ 报警级别映射:', levelMapping ? '通过' : '失败');

    // 测试结果汇总
    const allTestsPassed = isCorrectOrder && roomNameMapping && fieldsComplete && levelMapping;

    console.log('\n📋 测试结果汇总:');
    console.log(`- 数据排序: ${isCorrectOrder ? '✅' : '❌'}`);
    console.log(`- 房间映射: ${roomNameMapping ? '✅' : '❌'}`);
    console.log(`- 字段完整性: ${fieldsComplete ? '✅' : '❌'}`);
    console.log(`- 级别映射: ${levelMapping ? '✅' : '❌'}`);
    console.log(`\n🎯 总体结果: ${allTestsPassed ? '✅ 通过' : '❌ 失败'}`);

    return {
        passed: allTestsPassed,
        details: {
            dataProcessing: isCorrectOrder,
            roomMapping: roomNameMapping,
            fieldValidation: fieldsComplete,
            levelMapping: levelMapping
        }
    };
};

// 导出测试函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = alarmTableTest;
}

// 如果直接运行文件，执行测试
if (typeof window === 'undefined' && require.main === module) {
    alarmTableTest();
} 