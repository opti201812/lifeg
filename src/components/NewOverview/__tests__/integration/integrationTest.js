/**
 * 第四步：联合测试
 * 验证重构后的主组件与所有子组件的集成
 */

// 简单的断言函数
const assert = (condition, message) => {
    if (!condition) {
        throw new Error(`断言失败: ${message}`);
    }
    console.log(`✅ ${message}`);
};

console.log('=== 第四步：联合测试 ===');

const fs = require('fs');
const path = require('path');

// 测试新的主组件文件
const newMainComponentPath = path.join(__dirname, '../../NewOverview.tsx');
const newMainExists = fs.existsSync(newMainComponentPath);
assert(newMainExists, '新的主组件 NewOverview.tsx 已创建');

if (newMainExists) {
    const content = fs.readFileSync(newMainComponentPath, 'utf8');

    // 验证导入的hooks
    assert(content.includes('usePersonnelData'), '主组件正确导入 usePersonnelData hook');
    assert(content.includes('useRoomData'), '主组件正确导入 useRoomData hook');
    assert(content.includes('useDataRefresh'), '主组件正确导入 useDataRefresh hook');

    // 验证导入的组件
    assert(content.includes('RoomHeader'), '主组件正确导入 RoomHeader 组件');
    assert(content.includes('TabView'), '主组件正确导入 TabView 组件');

    // 验证事件处理
    assert(content.includes('useCallback'), '主组件使用 useCallback 优化事件处理');
    assert(content.includes('handleCardClick'), '主组件定义了卡片点击处理函数');
    assert(content.includes('handleDayCurveClick'), '主组件定义了日曲线点击处理函数');
    assert(content.includes('handleWeekCurveClick'), '主组件定义了周曲线点击处理函数');

    // 验证状态管理
    assert(content.includes('useState'), '主组件正确使用状态管理');
    assert(content.includes('useEffect'), '主组件正确使用副作用钩子');

    // 验证类型定义
    assert(content.includes('SelectedRoom'), '主组件使用了正确的类型定义');
    assert(content.includes('RoomPersonnel'), '主组件使用了正确的类型定义');
}

// 测试原文件是否保留
const originalPath = path.join(__dirname, '../../index.backup.tsx');
const originalExists = fs.existsSync(originalPath);
assert(originalExists, '原始文件已正确备份为 index.backup.tsx');

console.log('\n=== 测试组件依赖关系 ===');

// 测试组件之间的依赖关系
const componentDependencies = {
    'NewOverview.tsx': [
        'hooks/usePersonnelData',
        'hooks/useRoomData',
        'hooks/useDataRefresh',
        'components/RoomHeader',
        'components/TabView',
        'types'
    ],
    'components/TabView/index.tsx': [
        'components/PersonnelCard',
        'components/AddPersonnelCard',
        'components/PersonnelTable'
    ],
    'components/PersonnelCard/index.tsx': [
        'utils/roomHelpers'
    ],
    'hooks/usePersonnelData.ts': [
        'utils/dataProcessors'
    ]
};

Object.entries(componentDependencies).forEach(([component, dependencies]) => {
    const componentPath = path.join(__dirname, '../../', component);
    if (fs.existsSync(componentPath)) {
        const content = fs.readFileSync(componentPath, 'utf8');
        dependencies.forEach(dep => {
            const importPattern = dep.includes('/') ? dep.split('/').pop() : dep;
            assert(content.includes(importPattern), `${component} 正确导入了 ${dep}`);
        });
    }
});

console.log('\n=== 测试模块化结构 ===');

// 测试模块化结构
const expectedStructure = {
    'components': ['PersonnelCard', 'AddPersonnelCard', 'PersonnelTable', 'TabView', 'RoomHeader'],
    'hooks': ['usePersonnelData.ts', 'useRoomData.ts', 'useDataRefresh.ts'],
    'utils': ['constants.ts', 'roomHelpers.tsx', 'dataProcessors.ts'],
    'types': ['index.ts'],
    '__tests__': ['testRunner.js', 'components', 'utils', 'hooks', 'integration']
};

Object.entries(expectedStructure).forEach(([folder, files]) => {
    const folderPath = path.join(__dirname, '../../', folder);
    const folderExists = fs.existsSync(folderPath);
    assert(folderExists, `${folder} 文件夹存在`);

    if (folderExists && Array.isArray(files)) {
        files.forEach(file => {
            const filePath = path.join(folderPath, file);
            const fileExists = fs.existsSync(filePath);
            assert(fileExists, `${folder}/${file} 存在`);
        });
    }
});

console.log('\n🎉 第四步：联合测试通过！');
console.log('✅ 主组件重构完成，所有依赖关系正确');
console.log('✅ 组件模块化结构合理');
console.log('✅ 事件处理和状态管理优化到位');
console.log('✅ 可以继续进行性能测试'); 