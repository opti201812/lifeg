import React, { useState, useCallback } from "react";
import { Table, Button, Modal, Form, Input } from "antd";

interface Personnel {
   id: number;
   name: string;
   idNumber: string;
   occupation: string;
   age: number;
   heartRate: number;
   breathRate: number;
   medicalHistory: string;
}

const PersonnelManagement: React.FC = () => {
   const [personnel, setPersonnel] = useState<Personnel[]>([]);
   const [isModalVisible, setIsModalVisible] = useState(false);
   const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);

   const handleAddPersonnel = useCallback(
      (person: Personnel) => {
         setPersonnel([...personnel, person]);
      },
      [personnel]
   );

   const handleEditPersonnel = useCallback(
      (person: Personnel) => {
         setPersonnel(personnel.map((p) => (p.id === person.id ? person : p)));
      },
      [personnel]
   );

   const handleDeletePersonnel = useCallback(
      (id: number) => {
         setPersonnel(personnel.filter((p) => p.id !== id));
      },
      [personnel]
   );

   const showModal = useCallback((person: Personnel | null) => {
      setEditingPersonnel(person);
      setIsModalVisible(true);
   }, []);

   const handleOk = useCallback(
      (values: Personnel) => {
         if (editingPersonnel) {
            handleEditPersonnel(values);
         } else {
            handleAddPersonnel({ ...values, id: personnel.length + 1 });
         }
         setIsModalVisible(false);
      },
      [editingPersonnel, handleAddPersonnel, handleEditPersonnel, personnel.length]
   );

   const handleCancel = useCallback(() => {
      setIsModalVisible(false);
   }, []);

   const columns = [
      { title: "编号", dataIndex: "id", key: "id" },
      { title: "姓名", dataIndex: "name", key: "name" },
      { title: "身份证号码", dataIndex: "idNumber", key: "idNumber" },
      { title: "职业", dataIndex: "occupation", key: "occupation" },
      { title: "年龄", dataIndex: "age", key: "age" },
      { title: "心率", dataIndex: "heartRate", key: "heartRate" },
      { title: "呼吸", dataIndex: "breathRate", key: "breathRate" },
      { title: "病史", dataIndex: "medicalHistory", key: "medicalHistory" },
      {
         title: "操作",
         key: "action",
         render: (_: any, record: Personnel) => (
            <>
               <Button onClick={() => showModal(record)}>编辑</Button>
               <Button onClick={() => handleDeletePersonnel(record.id)}>删除</Button>
            </>
         ),
      },
   ];

   return (
      <div>
         <h2>人员信息管理</h2>
         <Button type='primary' onClick={() => showModal(null)}>
            新增人员
         </Button>
         <Table dataSource={personnel} columns={columns} rowKey='id' />
         <Modal
            title={editingPersonnel ? "编辑人员" : "新增人员"}
            visible={isModalVisible}
            onCancel={handleCancel}
            footer={null}
         >
            <Form
               initialValues={
                  editingPersonnel || {
                     id: "",
                     name: "",
                     idNumber: "",
                     occupation: "",
                     age: "",
                     heartRate: "",
                     breathRate: "",
                     medicalHistory: "",
                  }
               }
               onFinish={handleOk}
            >
               <Form.Item label='编号' name='id' rules={[{ required: true, message: "请输入编号" }]}>
                  <Input />
               </Form.Item>
               <Form.Item label='姓名' name='name' rules={[{ required: true, message: "请输入姓名" }]}>
                  <Input />
               </Form.Item>
               <Form.Item label='身份证号码' name='idNumber' rules={[{ required: true, message: "请输入身份证号码" }]}>
                  <Input />
               </Form.Item>
               <Form.Item label='职业' name='occupation' rules={[{ required: true, message: "请输入职业" }]}>
                  <Input />
               </Form.Item>
               <Form.Item label='年龄' name='age' rules={[{ required: true, message: "请输入年龄" }]}>
                  <Input type='number' />
               </Form.Item>
               <Form.Item label='心率' name='heartRate' rules={[{ required: true, message: "请输入心率" }]}>
                  <Input type='number' />
               </Form.Item>
               <Form.Item label='呼吸' name='breathRate' rules={[{ required: true, message: "请输入呼吸" }]}>
                  <Input type='number' />
               </Form.Item>
               <Form.Item label='病史' name='medicalHistory'>
                  <Input.TextArea rows={4} />
               </Form.Item>
               <Form.Item>
                  <Button type='primary' htmlType='submit'>
                     确定
                  </Button>
               </Form.Item>
            </Form>
         </Modal>
      </div>
   );
};

export default PersonnelManagement;
