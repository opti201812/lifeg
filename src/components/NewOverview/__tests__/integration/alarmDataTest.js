// AlarmTable数据处理测试
const alarmDataTest = () => {
    console.log('🔍 开始AlarmTable数据处理测试...');

    // 使用用户提供的Redis数据格式
    const mockReduxAlarms = [
        {
            personnelId: 20,
            type: 'alarm',
            personId: '20',
            timestamp: 1750426498368,
            devices: {
                radar: [
                    {
                        deviceId: '251500c9',
                        deviceType: '31',
                        distance: 389,
                        breathRate: 20,
                        heartRate: 124,
                        posture: 9,
                        pose: '坐姿'
                    }
                ],
                bracelet: null
            },
            queueTimestamp: 1750426498532,
            roomId: 1,
            alarm: {
                type: ['radarHeartRateAbnormal'],
                params: {
                    level: 2,
                    message: '心率异常'
                }
            },
            alarmTime: '2025-06-20T13:34:58.532Z',
            processed: false,
            createTimeStamp: 1750426499218
        }
    ];

    const mockRooms = [
        { id: 1, name: '讯问室1' },
        { id: 2, name: '讯问室2' }
    ];

    console.log('📊 测试数据准备完成');
    console.log(`- 报警数据: ${mockReduxAlarms.length} 条`);
    console.log(`- 房间数据: ${mockRooms.length} 个`);

    // 模拟AlarmTable组件的数据处理逻辑
    const getRoomNameById = (roomId) => {
        const room = mockRooms.find((r) => r.id === roomId);
        return room ? room.name : `未知房间(${roomId})`;
    };

    const getAlarmLevelText = (level) => {
        switch (level) {
            case 1:
                return "极度危险";
            case 2:
                return "危险";
            case 3:
                return "异常";
            default:
                return "";
        }
    };

    const getDeviceData = (devices) => {
        // 优先使用手环数据
        const braceletHeartRate = devices.bracelet?.heartRate;

        // 处理雷达数据（过滤掉0值，优先使用第一个有效数据）
        const validRadars = devices.radar?.filter((r) => (r.heartRate || 0) > 0) || [];
        const primaryRadar = validRadars[0] || devices.radar?.[0];

        return {
            heartRate: braceletHeartRate ?? primaryRadar?.heartRate ?? null,
            breathRate: primaryRadar?.breathRate ?? null,
            distance: primaryRadar?.distance ?? null,
            pose: primaryRadar?.pose ?? null,
            environment: primaryRadar?.environment ?? null,
        };
    };

    // 处理报警数据
    const processedAlarms = mockReduxAlarms.map((alarm, index) => {
        const deviceData = getDeviceData(alarm.devices);
        return {
            key: `${alarm.personnelId || index}-${alarm.alarmTime}`,
            alarmTime: alarm.alarmTime,
            level: alarm.alarm.params.level,
            message: alarm.alarm.params.message,
            roomId: alarm.roomId,
            roomName: getRoomNameById(alarm.roomId),
            personnelId: alarm.personnelId,
            ...deviceData,
        };
    });

    console.log('🔄 数据处理完成');
    console.log('- 处理后的数据:', JSON.stringify(processedAlarms[0], null, 2));

    // 验证数据处理结果
    const alarm = processedAlarms[0];
    const tests = {
        alarmTime: {
            expected: '2025-06-20T13:34:58.532Z',
            actual: alarm.alarmTime,
            pass: alarm.alarmTime === '2025-06-20T13:34:58.532Z'
        },
        level: {
            expected: 2,
            actual: alarm.level,
            pass: alarm.level === 2
        },
        levelText: {
            expected: '危险',
            actual: getAlarmLevelText(alarm.level),
            pass: getAlarmLevelText(alarm.level) === '危险'
        },
        message: {
            expected: '心率异常',
            actual: alarm.message,
            pass: alarm.message === '心率异常'
        },
        roomName: {
            expected: '讯问室1',
            actual: alarm.roomName,
            pass: alarm.roomName === '讯问室1'
        },
        heartRate: {
            expected: 124,
            actual: alarm.heartRate,
            pass: alarm.heartRate === 124
        },
        breathRate: {
            expected: 20,
            actual: alarm.breathRate,
            pass: alarm.breathRate === 20
        },
        distance: {
            expected: 389,
            actual: alarm.distance,
            pass: alarm.distance === 389
        }
    };

    console.log('\n📋 数据验证结果:');
    Object.entries(tests).forEach(([key, test]) => {
        console.log(`- ${key}: ${test.pass ? '✅' : '❌'} (期望: ${test.expected}, 实际: ${test.actual})`);
    });

    const allTestsPassed = Object.values(tests).every(test => test.pass);
    console.log(`\n🎯 总体结果: ${allTestsPassed ? '✅ 通过' : '❌ 失败'}`);

    return {
        passed: allTestsPassed,
        details: tests,
        processedData: processedAlarms
    };
};

// 导出测试函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = alarmDataTest;
}

// 如果直接运行文件，执行测试
if (typeof window === 'undefined' && require.main === module) {
    alarmDataTest();
} 