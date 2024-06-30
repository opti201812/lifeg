import React, { useState, useCallback } from "react";
import { Table, Button, Modal, Form, Input, Select } from "antd";

interface User {
   id: number;
   name: string;
   username: string;
   password: string;
   role: string;
   roomId: number;
   remark: string;
}

const UserManagement: React.FC = () => {
   const [users, setUsers] = useState<User[]>([]);
   const [isModalVisible, setIsModalVisible] = useState(false);
   const [editingUser, setEditingUser] = useState<User | null>(null);

   const handleAddUser = useCallback(
      (user: User) => {
         setUsers([...users, user]);
      },
      [users]
   );

   const handleEditUser = useCallback(
      (user: User) => {
         setUsers(users.map((u) => (u.id === user.id ? user : u)));
      },
      [users]
   );

   const handleDeleteUser = useCallback(
      (id: number) => {
         setUsers(users.filter((u) => u.id !== id));
      },
      [users]
   );

   const showModal = useCallback((user: User | null) => {
      setEditingUser(user);
      setIsModalVisible(true);
   }, []);

   const handleOk = useCallback(
      (values: User) => {
         if (editingUser) {
            handleEditUser(values);
         } else {
            handleAddUser({ ...values, id: users.length + 1 });
         }
         setIsModalVisible(false);
      },
      [editingUser, handleAddUser, handleEditUser, users.length]
   );

   const handleCancel = useCallback(() => {
      setIsModalVisible(false);
   }, []);

   const columns = [
      { title: "编号", dataIndex: "id", key: "id" },
      { title: "姓名", dataIndex: "name", key: "name" },
      { title: "账号", dataIndex: "username", key: "username" },
      { title: "权限", dataIndex: "role", key: "role" },
      { title: "房间号", dataIndex: "roomId", key: "roomId" },
      { title: "备注", dataIndex: "remark", key: "remark" },
      {
         title: "操作",
         key: "action",
         render: (_: any, record: User) => (
            <>
               <Button onClick={() => showModal(record)}>编辑</Button>
               <Button onClick={() => handleDeleteUser(record.id)}>删除</Button>
            </>
         ),
      },
   ];

   return (
      <div>
         <h2>用户管理</h2>
         <Button type='primary' onClick={() => showModal(null)}>
            新增用户
         </Button>
         <Table dataSource={users} columns={columns} rowKey='id' />
         <Modal
            title={editingUser ? "编辑用户" : "新增用户"}
            visible={isModalVisible}
            onCancel={handleCancel}
            footer={null}
         >
            <Form
               initialValues={
                  editingUser || { id: "", name: "", username: "", password: "", role: "", roomId: "", remark: "" }
               }
               onFinish={handleOk}
            >
               <Form.Item label='编号' name='id' rules={[{ required: true, message: "请输入编号" }]}>
                  <Input />
               </Form.Item>
               <Form.Item label='姓名' name='name' rules={[{ required: true, message: "请输入姓名" }]}>
                  <Input />
               </Form.Item>
               <Form.Item label='账号' name='username' rules={[{ required: true, message: "请输入账号" }]}>
                  <Input />
               </Form.Item>
               {!editingUser && (
                  <>
                     <Form.Item label='密码' name='password' rules={[{ required: true, message: "请输入密码" }]}>
                        <Input.Password />
                     </Form.Item>
                     <Form.Item
                        label='重复密码'
                        name='confirmPassword'
                        dependencies={["password"]}
                        rules={[
                           { required: true, message: "请再次输入密码" },
                           ({ getFieldValue }) => ({
                              validator(_, value) {
                                 if (!value || getFieldValue("password") === value) {
                                    return Promise.resolve();
                                 }
                                 return Promise.reject(new Error("两次输入的密码不一致"));
                              },
                           }),
                        ]}
                     >
                        <Input.Password />
                     </Form.Item>
                  </>
               )}
               <Form.Item label='权限' name='role' rules={[{ required: true, message: "请输入权限" }]}>
                  <Select>
                     <Select.Option value='admin'>管理员</Select.Option>
                     <Select.Option value='user'>用户</Select.Option>
                  </Select>
               </Form.Item>
               <Form.Item label='房间号' name='roomId' rules={[{ required: true, message: "请输入房间号" }]}>
                  <Input />
               </Form.Item>
               <Form.Item label='备注' name='remark'>
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

export default UserManagement;
