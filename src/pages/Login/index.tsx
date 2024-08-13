// pages/Login/index.tsx
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, message, Row, Col } from "antd";
import { setCurrentUser } from "../../store/userSlice";
import axios from "axios";
import config from "../../config";
import { AlertConfig } from "../../types"; // Import types

const Login: React.FC = () => {
   const [username, setUsername] = useState("");
   const [password, setPassword] = useState("");
   const [verificationCode, setVerificationCode] = useState(""); // New state for verification code
   const [showVerification, setShowVerification] = useState(false); // State to control visibility
   const dispatch = useDispatch();
   const navigate = useNavigate();

   useEffect(() => {
      // Fetch SMS config on component mount
      axios
         .get(`${config.backend.url}/smsconfig`)
         .then((res) => {
            const smsEnabledConfig = res.data.find((config: AlertConfig) => config.config_name === "smsEnabled");
            setShowVerification(smsEnabledConfig?.value === "true"); // Show if enabled
         })
         .catch((err) => {
            console.error("Error fetching SMS config:", err);
            message.error("Failed to load SMS settings");
         });
   }, []); // Empty dependency array ensures this runs only once on mount

   const handleLogin = async (values: any) => {
      try {
         const response = await axios.post(
            `${config.backend.url}/login`,
            {
               account: values.username,
               password: values.password,
               verificationCode: values.verificationCode, // Include verification code in request
            },
            { withCredentials: true }
         );

         if (response.status === 200) {
            dispatch(
               setCurrentUser({
                  id: response.data.user.id,
                  name: response.data.user.account,
                  role: response.data.user.role,
                  gender: response.data.user.gender,
                  age: response.data.user.age,
               })
            );

            if (response.data.user.role === "admin") {
               navigate("/overview");
            } else {
               navigate("/room");
            }
         } else {
            message.error(response.data.message || "Login failed");
         }
      } catch (error) {
         console.error("Login error:", error);
         if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
            message.error("无法连接到服务端，请检查服务器是否已启动？");
         } else {
            message.error("登录失败，请稍后再试");
         }
      }
   };

   const handleRequestVerificationCode = async () => {
      // Implement logic to request SMS verification code using username or phone number
      // This might involve sending an API request to your backend
      // For example:
      if (username) {
         try {
            const response = await axios.post(`${config.backend.url}/request-verification-code`, {
               username,
            });
            if (response.status === 200) {
               message.success("验证码已发送至您的手机，请注意查收");
            } else {
               message.error(response.data.message || "Failed to request verification code");
            }
         } catch (error) {
            console.error("Error requesting verification code:", error);
            message.error("请求验证码失败，请稍后再试");
         }
      } else {
         message.error("请输入用户名或手机号");
      }
   };

   return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
         <Form name='login' style={{ width: 300 }} onFinish={handleLogin}>
            <Form.Item name={"username"} label='用户名' rules={[{ required: true, message: "请输入用户名" }]}>
               <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </Form.Item>
            <Form.Item name={"password"} label='密码' rules={[{ required: true, message: "请输入密码" }]}>
               <Input.Password value={password} onChange={(e) => setPassword(e.target.value)} />
            </Form.Item>
            {showVerification && ( // Conditionally render verification fields
               <Row gutter={16}>
                  <Col span={16}>
                     <Form.Item label='短信验证码' style={{ display: "flex", justifyContent: "space-between" }}>
                        <Input value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} />
                     </Form.Item>
                  </Col>
                  <Col span={4}>
                     <Button type='default' onClick={handleRequestVerificationCode}>
                        获取验证码
                     </Button>
                  </Col>
               </Row>
            )}
            <Form.Item style={{ display: "flex", justifyContent: "center" }}>
               <Button type='primary' htmlType='submit' style={{ width: "150%" }}>
                  登录
               </Button>
            </Form.Item>
         </Form>
      </div>
   );
};

export default Login;
