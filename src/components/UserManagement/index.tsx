// components/UserManagement/index.tsx
import React, { useState, useCallback, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, message } from "antd";
import { settingSpace } from "../../styles/theme";
import axios from "axios";
import config from "../../config";
import { Room, User } from "../../types";
import { ExclamationCircleOutlined } from "@ant-design/icons"; // Import the icon

const UserManagement: React.FC = () => {
   const [form] = Form.useForm();
   const [users, setUsers] = useState<User[]>([]);
   const [isModalVisible, setIsModalVisible] = useState(false);
   const [editingUser, setEditingUser] = useState<User | null>(null);
   const [rooms, setRooms] = useState<Room[]>([]); // State to store room options

   // Fetch users on component mount
   useEffect(() => {
      const fetchUsers = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/users`); // Assuming /api/auth/users is the correct endpoint
            setUsers(response.data.user || []);
         } catch (error) {
            console.error("Error fetching users:", error);
            message.error("获取用户列表失败！"); // Add an error message
         }
      };
      fetchUsers();

      // Fetch rooms
      const fetchRooms = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/rooms`);
            setRooms(response.data || []);
         } catch (error) {
            console.error("Error fetching rooms:", error);
            message.error("获取房间列表失败！");
         }
      };

      fetchRooms();
   }, []);

   const handleAddUser = useCallback(
      async (user: User) => {
         try {
            if (user.account.toLowerCase() === "admin") {
               // Prevent creating a user with the username "admin"
               message.error("不允许创建用户名为admin的账户");
               return;
            }

            const response = await axios.post(`${config.backend.url}/users`, user);
            setUsers([...users, response.data.user]);
            setIsModalVisible(false);
         } catch (error) {
            console.error("Error adding user:", error);
         }
      },
      [config.backend.url, users]
   );

   const handleEditUser = useCallback(
      async (user: User) => {
         try {
            await axios.put(`${config.backend.url}/users/${user.id}`, user); // Update user

            // Refetch the updated user data
            const response = await axios.get(`${config.backend.url}/users/${user.id}`);
            const updatedUser = response.data;

            setUsers(users.map((u) => (u.id === user.id ? updatedUser.user : u)));
            setIsModalVisible(false);
            message.success("更新用户信息成功");
         } catch (error) {
            console.error("Error editing user:", error);
            message.error("更新用户信息失败！"); // Add an error message
         }
      },
      [users]
   );

   const handleDeleteUser = useCallback(
      async (id: number) => {
         Modal.confirm({
            title: "确认删除",
            icon: <ExclamationCircleOutlined />,
            content: "您确定要删除该用户吗？",
            okText: "确定",
            cancelText: "取消",
            onOk: async () => {
               // Use async function here
               try {
                  await axios.delete(`${config.backend.url}/users/${id}`);
                  setUsers(users.filter((u) => u.id !== id));
                  message.success("User deleted successfully");
               } catch (error) {
                  console.error("Error deleting user:", error);
                  message.error("Failed to delete user");
               }
            },
         });
      },
      [config.backend.url, users]
   );

   const showModal = useCallback((user: User | null) => {
      form.setFieldsValue(user); // Reset form fields
      setEditingUser(user);
      setIsModalVisible(true);
   }, []);

   const handleOk = useCallback(async () => {
      try {
         const values = await form.validateFields(); // Get validated form values

         if (editingUser) {
            handleEditUser(values);
         } else {
            handleAddUser(values);
         }
         setIsModalVisible(false);
      } catch (errorInfo) {
         console.log("Validation failed:", errorInfo);
      }
   }, [editingUser, handleAddUser, handleEditUser, form]); // Include 'form' in the dependency array

   const handleCancel = useCallback(() => {
      setIsModalVisible(false);
   }, []);

   const columns = [
      { title: "姓名", dataIndex: "name", key: "name" },
      { title: "账号/手机号", dataIndex: "account", key: "account" },
      { title: "权限", dataIndex: "role", key: "role" },
      { title: "房间号", dataIndex: "room_id", key: "room_id" },
      {
         title: "操作",
         key: "action",
         render: (_: any, record: User) => (
            <>
               <Button onClick={() => showModal(record)}>编辑</Button>
               {record.role !== "admin" && ( // Conditionally render delete button
                  <Button onClick={() => handleDeleteUser(record.id)}>删除</Button>
               )}
            </>
         ),
      },
   ];

   return (
      <div style={settingSpace}>
         <h2>用户管理</h2>
         <Button type='primary' onClick={() => showModal(null)}>
            新增用户
         </Button>
         <Table dataSource={users} columns={columns} rowKey='id' />
         <Modal
            title={editingUser ? "编辑用户" : "新增用户"}
            open={isModalVisible}
            onCancel={handleCancel}
            footer={null}
         >
            <Form
               form={form}
               // initialValues={editingUser || { id: "", name: "", account: "", password: "", role: "", room_id: "" }}
               onFinish={handleOk}
               onFinishFailed={(errorInfo) => {
                  console.log("Failed:", errorInfo);
               }}
            >
               <Form.Item
                  label='编号'
                  name='id'
                  rules={[{ required: false, message: "请输入编号" }]}
                  style={{ display: "none" }}
               >
                  <Input />
               </Form.Item>
               <Form.Item label='姓名' name='name' rules={[{ required: true, message: "请输入姓名" }]}>
                  <Input autoComplete='off' />
               </Form.Item>
               <Form.Item
                  label='账号/手机号'
                  name='account'
                  rules={[
                     { required: true, message: "请输入手机号" },
                     {
                        pattern: /^1\d{10}$/,
                        message: "请输入以11位数字手机号",
                     },
                  ]}
               >
                  <Input autoComplete='off' />
               </Form.Item>
               {!editingUser && (
                  <>
                     <Form.Item label='密码' name='password' rules={[{ required: true, message: "请输入密码" }]}>
                        <Input.Password autoComplete='off' />
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
                        <Input.Password autoComplete='off' />
                     </Form.Item>
                  </>
               )}
               <Form.Item
                  initialValue={"user"}
                  label='权限'
                  name='role'
                  rules={[{ required: true, message: "请输入权限" }]}
               >
                  <Select>
                     {/* <Select.Option value='admin'>管理员</Select.Option> */}
                     <Select.Option value='user'>用户</Select.Option>
                  </Select>
               </Form.Item>
               <Form.Item
                  label='房间号'
                  name='room_id'
                  rules={[{ required: !editingUser?.role || editingUser?.role === "user", message: "请选择房间号" }]} // Required only for users
               >
                  <Select
                     allowClear // Allow clearing the selection
                     placeholder='请选择房间号'
                     disabled={editingUser?.role === "admin"} // Disable for admin users
                  >
                     {rooms.map((room) => (
                        <Select.Option key={room.id} value={room.id}>
                           {room.name}
                        </Select.Option>
                     ))}
                  </Select>
               </Form.Item>{" "}
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
