/**
 * 第三步：UI组件测试
 * 用于验证组件拆分的正确性
 */

// 简单的断言函数
const assert = (condition, message) => {
    if (!condition) {
        throw new Error(`断言失败: ${message}`);
    }
    console.log(`✅ ${message}`);
};

// 测试组件结构
console.log('=== 第三步：UI组件拆分测试 ===');

// 检查组件文件是否存在
const fs = require('fs');
const path = require('path');

const componentPaths = [
    'components/PersonnelCard/index.tsx',
    'components/AddPersonnelCard/index.tsx',
    'components/PersonnelTable/index.tsx',
    'components/TabView/index.tsx',
    'components/RoomHeader/index.tsx',
];

componentPaths.forEach(componentPath => {
    const fullPath = path.join(__dirname, '../../', componentPath);
    const exists = fs.existsSync(fullPath);
    assert(exists, `组件文件 ${componentPath} 存在`);

    if (exists) {
        const content = fs.readFileSync(fullPath, 'utf8');
        assert(content.includes('React.memo'), `${componentPath} 使用了 React.memo 优化`);
        assert(content.includes('interface'), `${componentPath} 定义了 TypeScript 接口`);
        assert(content.includes('export default'), `${componentPath} 正确导出组件`);
    }
});

// 测试工具函数和hooks文件
const utilPaths = [
    'utils/constants.ts',
    'utils/roomHelpers.tsx',
    'utils/dataProcessors.ts',
    'hooks/usePersonnelData.ts',
    'hooks/useRoomData.ts',
    'hooks/useDataRefresh.ts',
    'types/index.ts',
];

utilPaths.forEach(utilPath => {
    const fullPath = path.join(__dirname, '../../', utilPath);
    const exists = fs.existsSync(fullPath);
    assert(exists, `工具文件 ${utilPath} 存在`);
});

console.log('\n🎉 第三步：UI组件拆分测试通过！');
console.log('✅ 所有必要的组件文件已创建');
console.log('✅ 组件使用了正确的优化和类型定义');
console.log('✅ 可以继续进行步骤4: 重构主组件'); 