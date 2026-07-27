import React, { useState, useEffect } from "react";
import { Modal, FormInstance } from "antd";
import RegistrationFormEnhanced from "./RegistrationFormEnhanced";
import { BraceletDevice, RegistrationRecord, RoomData } from "../types";

interface RegistrationModalProps {
   visible: boolean;
   isEditing: boolean;
   pendingRecord: RegistrationRecord | null;
   form: FormInstance;
   loading: boolean;
   availableBracelets: string[];
   availableOximeters: string[];
   rooms: RoomData[];
   oximeterEnabled: boolean;
   braceletEnabled: boolean;
   oximeterId?: string | null;
   braceletId?: string | null;
   editingPersonnelId?: number;
   onOximeterToggle: (deviceId?: string) => void;
   onBraceletToggle: (deviceId?: string) => void;
   onCancel: () => void;
   onSubmit: (values: any) => void;
   onLoadBraceletData?: (braceletId: string) => Promise<BraceletDevice | null>;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({
   visible,
   isEditing,
   pendingRecord,
   form,
   loading,
   availableBracelets,
   availableOximeters,
   rooms,
   oximeterEnabled,
   braceletEnabled,
   oximeterId,
   braceletId,
   editingPersonnelId,
   onOximeterToggle,
   onBraceletToggle,
   onCancel,
   onSubmit,
   onLoadBraceletData,
}) => {
   const [confirmingOximeter, setConfirmingOximeter] = useState(false);

   useEffect(() => {
      if (visible && pendingRecord) {
         form.setFieldsValue(pendingRecord);
      }
   }, [visible, pendingRecord, form]);

   const handleFormSubmit = (values: any) => {
      const hasOximeter = !!values.oximeterId;

      if (hasOximeter && !isEditing && !confirmingOximeter) {
         setConfirmingOximeter(true);
         Modal.confirm({
            title: "确认血氧仪绑定",
            content: "该人员是否将持续佩戴本血氧仪？",
            okText: "是，持续佩戴",
            cancelText: "否，仅本次检录",
            onOk: () => {
               setConfirmingOximeter(false);
               onSubmit(values);
            },
            onCancel: () => {
               setConfirmingOximeter(false);
               const valuesWithoutOximeter = { ...values, oximeterId: null };
               onSubmit(valuesWithoutOximeter);
            },
         });
      } else {
         onSubmit(values);
      }
   };

   return (
      <Modal
         title={isEditing ? "编辑检录信息" : "新增检录"}
         open={visible}
         onCancel={onCancel}
         footer={null}
         width={900}
         destroyOnHidden
      >
         <RegistrationFormEnhanced
            form={form}
            availableBracelets={availableBracelets}
            availableOximeters={availableOximeters}
            rooms={rooms}
            oximeterEnabled={oximeterEnabled}
            braceletEnabled={braceletEnabled}
            oximeterId={oximeterId}
            braceletId={braceletId}
            onOximeterToggle={onOximeterToggle}
            onBraceletToggle={onBraceletToggle}
            onCancel={onCancel}
            onSubmit={handleFormSubmit}
            loading={loading}
            isEditing={isEditing}
            onLoadBraceletData={onLoadBraceletData}
            editingPersonnelId={editingPersonnelId}
         />
      </Modal>
   );
};

export default RegistrationModal;
