// components/LicenseManagment/index.tsx

import React, { useState, useEffect } from "react";
import { Form, Input, Button, Select, message, Row, Col, Tooltip } from "antd";
import { CopyOutlined, ImportOutlined } from "@ant-design/icons";
import axios from "axios";
import config from "../../config";
import { activateLicense } from "../../services/licenseService";
const { Option } = Select;

const LicenseManagement: React.FC = () => {
   const [authCode, setAuthCode] = useState("");
   const [machineCode, setMachineCode] = useState("");
   const [licenseType, setLicenseType] = useState("");
   const [expiryDate, setExpiryDate] = useState("");
   const [form] = Form.useForm();
   let lastAuthCode: string | null = null;
   let blurErrorShown = false;
   const [loading, setLoading] = useState(false); // 添加 loading 状态

   // 获取当前授权信息
   const fetchCurrentLicenseInfo = async () => {
      try {
         const response = await axios.get(`${config.backend.url}/v1/license/current-info`);
         const data = response.data;

         // 设置机器码（无论授权是否有效都会返回）
         if (data.machineCode) {
            setMachineCode(data.machineCode);
            form.setFieldsValue({ machineCode: data.machineCode });
         }

         // 如果授权有效，设置授权类型和到期时间
         if (data.success && data.type && data.expiry) {
            setLicenseType(data.type);
            setExpiryDate(data.expiry);
            form.setFieldsValue({
               licenseType: data.type,
               expiryDate: data.expiry,
            });
         }
      } catch (error) {
         console.error("Error fetching current license info:", error);
         message.error("获取当前授权信息失败");
      }
   };

   useEffect(() => {
      fetchCurrentLicenseInfo();
   }, []);

   const copyMachineCode = () => {
      navigator.clipboard
         .writeText(machineCode)
         .then(() => {
            message.success("机器码已复制到剪贴板");
         })
         .catch((err) => {
            message.error("复制失败");
         });
   };

   const pasteAuthCode = async () => {
      try {
         const text = await navigator.clipboard.readText();
         setAuthCode(text);
         form.setFieldsValue({ authCode: text });
      } catch (err) {
         message.error("读取剪贴板失败");
      } finally {
         await handleAuthCodeBlur(); // 将校验逻辑移到 finally 块中
      }
   };

   const handleAuthCodeBlur = async (newCode?: string) => {
      const authCode = newCode || form.getFieldValue("authCode");
      if (authCode === lastAuthCode && blurErrorShown) {
         return;
      }
      blurErrorShown = false;

      if (authCode) {
         setLoading(true); // 开始加载
         try {
            const response = await axios.post(`${config.backend.url}/v1/license/decrypt`, {
               licenseCode: authCode,
            });
            if (response.data.success) {
               setLicenseType(response.data.type);
               setExpiryDate(response.data.expiry);
               form.setFieldsValue({
                  licenseType: response.data.type,
                  expiryDate: response.data.expiry,
               });
               lastAuthCode = authCode;
            } else {
               message.error("授权码解析失败: " + response.data.message);
               blurErrorShown = true;
               lastAuthCode = authCode;
            }
         } catch (error) {
            console.error("Error:", error);
            message.error("授权码解析请求失败，请稍后再试");
            blurErrorShown = true;
            lastAuthCode = authCode;
         } finally {
            setLoading(false); // 结束加载
         }
      } else {
         lastAuthCode = null;
      }
   };

   const handleSubmit = async (values: any) => {
      if (authCode) {
         // 双写两侧：本侧(Backend) 失败界面提示；对侧(CSM) 失败仅 console
         const result = await activateLicense(authCode);
         if (result.backend) {
            message.success("授权码提交成功! 请重新启动服务端，并重新登录以应用新授权");
         } else {
            message.error("授权码提交失败! 请勿重复提交、勿提交非本机授权码");
         }
      } else {
         message.warning("请先填写授权码");
      }
   };

   return (
      <Row justify='center'>
         <Col span={12}>
            <h2>许可证信息</h2>
            <Form form={form} onFinish={handleSubmit}>
               <Form.Item label='当前机器码'>
                  <Row gutter={8}>
                     <Col span={18}>
                        <Input value={machineCode} readOnly />
                     </Col>
                     <Col span={6}>
                        <Tooltip title='1. 请点击复制机器码，通过邮件或其它方式发送给本软件的供应商，以获取软件授权码'>
                           <Button icon={<CopyOutlined />} onClick={copyMachineCode}>
                              复制机器码
                           </Button>
                        </Tooltip>
                     </Col>
                  </Row>
               </Form.Item>
               <Form.Item label='授权码' name='authCode'>
                  <Row gutter={8}>
                     <Col span={18}>
                        <Input
                           value={authCode}
                           onChange={(e) => setAuthCode(e.target.value)}
                           onBlur={() => handleAuthCodeBlur()}
                        />
                     </Col>
                     <Col span={6}>
                        <Tooltip title='2. 在从本软件供应商处获取授权码后，在左侧输入框中输入或粘贴该软件授权码'>
                           <Button icon={<ImportOutlined />} onClick={pasteAuthCode} loading={loading}>
                              {loading ? "校验中" : "粘贴授权码"}
                           </Button>
                        </Tooltip>
                     </Col>
                  </Row>
               </Form.Item>
               <Row gutter={8}>
                  <Col span={12}>
                     <Form.Item label='授权类型' name='licenseType'>
                        <Select disabled>
                           <Option value='trial'>试用</Option>
                           <Option value='full'>正式</Option>
                        </Select>
                     </Form.Item>
                  </Col>
                  <Col span={12}>
                     <Form.Item label='到期日期' name='expiryDate'>
                        <Input readOnly />
                     </Form.Item>
                  </Col>
               </Row>
               <Form.Item>
                  <Tooltip title='3. 在输入正确的软件授权码后，请点击启用该授权，以便正常使用本系统'>
                     <Button type='primary' htmlType='submit' block>
                        启用授权
                     </Button>
                  </Tooltip>{" "}
               </Form.Item>
            </Form>
         </Col>
      </Row>
   );
};

export default LicenseManagement;
