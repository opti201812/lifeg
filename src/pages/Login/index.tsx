import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button } from "antd";
import { setCurrentUser } from "../../store/userSlice";

const Login: React.FC = () => {
   const [username, setUsername] = useState("");
   const [password, setPassword] = useState("");
   const dispatch = useDispatch();
   const navigate = useNavigate();

   const handleLogin = () => {
      // 简单的用户名密码验证逻辑
      if (username === "admin" && password === "password") {
         dispatch(setCurrentUser({ id: 1, name: "admin" }));
         navigate("/overview");
      } else {
         alert("用户名或密码错误");
      }
   };

   return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
         <Form name='login' style={{ width: 300 }} onFinish={handleLogin}>
            <Form.Item label='用户名' name='username' rules={[{ required: true, message: "请输入用户名" }]}>
               <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </Form.Item>
            <Form.Item label='密码' name='password' rules={[{ required: true, message: "请输入密码" }]}>
               <Input.Password value={password} onChange={(e) => setPassword(e.target.value)} />
            </Form.Item>
            <Form.Item>
               <Button type='primary' htmlType='submit' style={{ width: "100%" }}>
                  登录
               </Button>
            </Form.Item>
         </Form>
      </div>
   );
};

export default Login;
