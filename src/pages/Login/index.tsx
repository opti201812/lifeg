// pages/Login/index.tsx
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, message, Row, Col, Checkbox, Tooltip } from "antd";
import { logout, setCurrentUser } from "../../store/userSlice";
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
   const [rememberMe, setRememberMe] = useState(localStorage.getItem("rememberMe") === "true"); // State for the checkbox
   const [countdown, setCountdown] = useState(0); // State for countdown timer

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
         });
   }, []);

   useEffect(() => {
      const checkAuth = async () => {
         try {
            const response = await axios.post(`${config.backend.url}/login`, {}, { withCredentials: true });
            if (response.data.success && response.data.message === "Already logged in") {
               dispatch(setCurrentUser(response.data.user));
            } else {
               dispatch(logout());
            }
         } catch (error) {
            dispatch(logout());
         }
      };

      checkAuth();
   }, [dispatch]);

   const handleLogin = async (values: any) => {
      try {
         const response = await axios.post(
            `${config.backend.url}/login`,
            {
               account: values.username,
               password: values.password,
               verificationCode: values.verificationCode, // Include verification code in request
            },
            {
               withCredentials: false, // when user click to login, not include credentials in request
            }
         );

         if (response.status === 200) {
            dispatch(
               setCurrentUser({
                  ...response.data.user, // Spread all user properties
                  name: response.data.user.name || response.data.user.account, // Use name or account as fallback
               })
            );
            // Store rememberMe preference in localStorage
            localStorage.setItem("rememberMe", rememberMe.toString());

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
      if (countdown > 0) {
         message.warning(`请${countdown}秒后再试`);
         return;
      }
      // Implement logic to request SMS verification code using username or phone number
      // This might involve sending an API request to your backend
      // For example:
      if (username) {
         try {
            const response = await axios.post(`${config.backend.url}/request-verification-code`, {
               account: username,
            });
            if (response.status === 200) {
               message.success("验证码已发送至您的手机，请注意查收");
               setCountdown(60); // Start countdown
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
   useEffect(() => {
      let interval: NodeJS.Timeout | null = null; // Initialize interval to null

      if (countdown > 0) {
         interval = setInterval(() => {
            setCountdown(countdown - 1);
         }, 1000);
      }

      return () => {
         if (interval) {
            // Only clear the interval if it's been set
            clearInterval(interval);
         }
      };
   }, [countdown]);

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
                     <Form.Item
                        label='短信验证码'
                        name='verificationCode'
                        style={{ display: "flex", justifyContent: "space-between" }}
                     >
                        <Input value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} />
                     </Form.Item>
                  </Col>
                  <Col span={4}>
                     <Tooltip title={/^1\d{10}$/.test(username) ? "" : "账号非手机号，不可以发送短信验证码"}>
                        <Button
                           type='default'
                           onClick={handleRequestVerificationCode}
                           disabled={countdown > 0 || !/^1\d{10}$/.test(username)}
                        >
                           {countdown > 0 ? `${countdown}秒后重试` : "获取验证码"}
                        </Button>
                     </Tooltip>
                  </Col>
               </Row>
            )}
            <Row gutter={16} justify='space-between'>
               <Col span={24} style={{ textAlign: "right" }}>
                  <Tooltip title='请联系系统管理员修改密码' trigger='click'>
                     <a href='#'>忘记密码？</a>
                  </Tooltip>
               </Col>
            </Row>

            <Form.Item style={{ display: "flex", justifyContent: "center" }}>
               <Button type='primary' htmlType='submit' style={{ width: "150%", marginTop: 20 }}>
                  登录
               </Button>
            </Form.Item>
         </Form>
      </div>
   );
};

export default Login;
