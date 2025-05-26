/**
 * 计算电池电量百分比
 * @param {number} voltage - 电池电压值
 * @returns {number} 电量百分比(0-100的整数)
 */
export const calculateBatteryPercentage = (voltage) => {
    if (voltage === undefined || voltage === null) return 0;

    // 电压区间定义
    const FULL_CHARGE = 4.5;
    const HIGH_LEVEL = 4.2;
    const PLATEAU = 3.5;
    const LOW_LEVEL = 3.0;

    // 过放
    if (voltage < LOW_LEVEL) return 0;

    // 低电量区 (3.0-3.68V) - 线性计算 0%-20%
    if (voltage < PLATEAU) {
        return Math.round(((voltage - LOW_LEVEL) / (PLATEAU - LOW_LEVEL)) * 20);
    }

    // 平台区 (3.68-3.82V) - 线性计算 20%-80%
    if (voltage < HIGH_LEVEL) {
        return 20 + Math.round(((voltage - PLATEAU) / (HIGH_LEVEL - PLATEAU)) * 60);
    }

    // 高电量区 (3.82-4.2V) - 线性计算 80%-100%
    if (voltage < FULL_CHARGE) {
        return 80 + Math.round(((voltage - HIGH_LEVEL) / (FULL_CHARGE - HIGH_LEVEL)) * 20);
    }

    // 满电
    return 100;
};

/**
 * 计算电池状态
 * @param {number} voltage - 电池电压值
 * @returns {{isNormal: boolean, status: string}} 电池状态对象
 */
export const getBatteryStatus = (voltage) => {
    if (!voltage) {
        return {
            isNormal: false,
            status: "-"
        };
    }

    if (voltage >= 3.5) {
        return {
            isNormal: true,
            status: "正常"
        };
    } else {
        return {
            isNormal: false,
            status: "需充电"
        };
    }
};
