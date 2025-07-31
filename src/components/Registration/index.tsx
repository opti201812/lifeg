import React, { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Button, message, Spin } from "antd";
import { UserOutlined, ClockCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import config from "../../config";

const Registration: React.FC = () => {
   const [loading, setLoading] = useState(true);
   const [stats, setStats] = useState({
      totalRegistrations: 0,
      todayRegistrations: 0,
      pendingRegistrations: 0,
   });

   useEffect(() => {
      const fetchRegistrationStats = async () => {
         try {
            setLoading(true);

            // TODO: 调用获取检录统计数据的API
            const response = await axios.get(`${config.backend.url}/registration/stats`);

            setStats({
               totalRegistrations: response.data.totalRegistrations || 0,
               todayRegistrations: response.data.todayRegistrations || 0,
               pendingRegistrations: response.data.pendingRegistrations || 0,
            });
         } catch (error) {
            console.error("获取检录统计数据失败:", error);
            message.error("获取检录统计数据失败");
         } finally {
            setLoading(false);
         }
      };

      fetchRegistrationStats();
   }, []);

   return (
      <div style={{ padding: 24 }}>
         <h1>检录管理</h1>

         {loading ? (
            <div style={{ textAlign: "center", margin: "50px 0" }}>
               <Spin size='large' />
               <p style={{ marginTop: 16 }}>加载中...</p>
            </div>
         ) : (
            <>
               <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  <Col xs={24} sm={12} md={8}>
                     <Card loading={loading}>
                        <Statistic
                           title='总检录数'
                           value={stats.totalRegistrations}
                           valueStyle={{ color: "#3f8600" }}
                           prefix={<UserOutlined />}
                        />
                     </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                     <Card loading={loading}>
                        <Statistic
                           title='今日检录'
                           value={stats.todayRegistrations}
                           valueStyle={{ color: "#1890ff" }}
                           prefix={<ClockCircleOutlined />}
                        />
                     </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                     <Card loading={loading}>
                        <Statistic
                           title='待检录'
                           value={stats.pendingRegistrations}
                           valueStyle={{ color: "#fa8c16" }}
                           prefix={<CheckCircleOutlined />}
                        />
                     </Card>
                  </Col>
               </Row>

               <Row gutter={[16, 16]}>
                  <Col span={24}>
                     <Card title='检录功能' style={{ height: "100%" }}>
                        <p>检录功能正在开发中...</p>
                        <p>该功能将包括：</p>
                        <ul>
                           <li>人员信息录入</li>
                           <li>身份验证</li>
                           <li>设备分配</li>
                           <li>检录记录管理</li>
                        </ul>
                        <Button type='primary' disabled>
                           开始检录
                        </Button>
                     </Card>
                  </Col>
               </Row>
            </>
         )}
      </div>
   );
};

export default Registration;
