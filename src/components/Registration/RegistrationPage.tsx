import React, { useEffect } from "react";
import { Form, Card, Row, Col } from "antd";
import { RegistrationHeader, RegistrationTable, RegistrationModal } from "./components";
import { useRegistrationData, useRegistrationModal } from "./hooks";
import { RegistrationRecord } from "./types";

/**
 * 检录管理页面
 *
 * 职能拆分：
 * - RegistrationHeader: 页面头部和操作按钮
 * - RegistrationTable: 检录列表表格
 * - RegistrationModal: 新增/编辑检录弹窗
 * - RegistrationFormEnhanced: 检录表单（支持手环/血氧仪自动填充）
 * - useRegistrationData Hook: 数据获取和 API 调用
 * - useRegistrationModal Hook: Modal 状态管理
 * - services/registrationService: API 请求封装
 */
const RegistrationPage: React.FC = () => {
   const [form] = Form.useForm();

   // 数据管理 Hook
   const {
      registrationRecords,
      availableBracelets,
      availableOximeters,
      rooms,
      loading,
      tableLoading,
      loadAvailableBracelets,
      loadAvailableOximeters,
      loadRegistrationRecords,
      loadRooms,
      loadBraceletDataForForm,
      loadOximeterDataForForm,
      refreshAllData,
      handleCreate,
      handleUpdate,
      handleDelete,
   } = useRegistrationData();

   // Modal 状态管理 Hook
   const { isModalVisible, editingRecord, oximeterEnabled, braceletEnabled, oximeterId, braceletId, pendingRecord, openModal, closeModal, toggleOximeterConnection, toggleBraceletConnection } =
      useRegistrationModal(form);

   // 初始化加载数据
   useEffect(() => {
      loadRegistrationRecords();
      loadAvailableBracelets();
      loadAvailableOximeters();
      loadRooms();
   }, [loadRegistrationRecords, loadAvailableBracelets, loadAvailableOximeters, loadRooms]);

   // 处理表单提交
   const handleFormSubmit = async (values: any) => {
      let success = false;

      if (editingRecord) {
         success = await handleUpdate(editingRecord, values);
      } else {
         // 新增检录时，如有血氧仪则询问是否持续佩戴
         const askContinueWearing = async (): Promise<boolean> => {
            return new Promise((resolve) => {
               // Modal 已在 RegistrationModal 中处理，此处作为备选方案
               // 实际的确认逻辑在 RegistrationModal 中执行
               resolve(true);
            });
         };

         success = await handleCreate(values, askContinueWearing);
      }

      if (success) {
         closeModal();
      }
   };

   // 处理编辑操作
   const handleEditClick = (record: RegistrationRecord) => {
      openModal(record);
   };

   // 处理删除操作
   const handleDeleteClick = async (record: RegistrationRecord) => {
      const success = await handleDelete(record);
      // 删除逻辑已在 service 中处理，此处仅作为确认点
      if (success) {
         // 已在 handleDelete 中刷新数据
      }
   };

   return (
      <div style={{ padding: "24px" }}>
         {/* 页面头部 */}
         <Row gutter={16} style={{ marginBottom: "24px" }}>
            <Col span={24}>
               <RegistrationHeader onAddNew={() => openModal()} onRefresh={refreshAllData} />
            </Col>
         </Row>

         {/* 检录列表 */}
         <Card>
            <RegistrationTable
               dataSource={registrationRecords}
               loading={tableLoading}
               onEdit={handleEditClick}
               onDelete={handleDeleteClick}
            />
         </Card>

          {/* 新增/编辑检录 Modal */}
          <RegistrationModal
             visible={isModalVisible}
             isEditing={!!editingRecord}
             pendingRecord={pendingRecord}
             form={form}
             loading={loading}
             availableBracelets={availableBracelets}
             availableOximeters={availableOximeters}
             rooms={rooms}
             oximeterEnabled={oximeterEnabled}
             braceletEnabled={braceletEnabled}
             oximeterId={oximeterId}
             braceletId={braceletId}
             editingPersonnelId={editingRecord?.personnelId}
             onOximeterToggle={toggleOximeterConnection}
             onBraceletToggle={toggleBraceletConnection}
             onCancel={closeModal}
             onSubmit={handleFormSubmit}
             onLoadBraceletData={loadBraceletDataForForm}
          />
      </div>
   );
};

export default RegistrationPage;
