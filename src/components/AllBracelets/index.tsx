import React, { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Button } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../../config";

const AllBracelets: React.FC = () => {
   const [totalBracelets, setTotalBracelets] = useState(0);
   const [assignedBracelets, setAssignedBracelets] = useState(0);
   const [unassignedBracelets, setUnassignedBracelets] = useState(0);
   const [onlineBracelets, setOnlineBracelets] = useState(0);
   const [loading, setLoading] = useState(true);
   const navigate = useNavigate();

   useEffect(() => {
      const fetchBraceletsData = async () => {
         try {
            setLoading(true);

            // 获取手环数据
            const braceletResponse = await axios.get(`${config.backend.url}/rooms/bracelets`);

            // 获取关联数据
            const associationsResponse = await axios.get(`${config.backend.url}/associations`);

            // 确保 associations 是数组
            const associations = Array.isArray(associationsResponse.data?.data)
               ? associationsResponse.data.data
               : Array.isArray(associationsResponse.data)
               ? associationsResponse.data
               : [];

            // 提取已分配的手环ID集合
            const assignedBraceletIds = new Set(
               associations.filter((a: any) => a.braceletId != null).map((a: any) => a.braceletId.toString())
            );

            // 处理CSM API返回的数据
            const braceletData = braceletResponse.data || {};
            const onlineBracelets = braceletData.onlineBracelets || [];
            const offlineBracelets = braceletData.offlineBracelets || [];

            // 计算统计数据
            const total = onlineBracelets.length + offlineBracelets.length;
            const online = onlineBracelets.length;

            let assigned = 0;
            [...onlineBracelets, ...offlineBracelets].forEach((bracelet: any) => {
               if (assignedBraceletIds.has(bracelet.deviceId?.toString())) {
                  assigned++;
               }
            });

            setTotalBracelets(total);
            setOnlineBracelets(online);
            setAssignedBracelets(assigned);
            setUnassignedBracelets(total - assigned);
         } catch (error) {
            console.error("获取手环数据失败:", error);
         } finally {
            setLoading(false);
         }
      };

      fetchBraceletsData();
   }, []);

   return (
      <div style={{ padding: 24 }}>
         <h1>全部手环</h1>

         <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
               <Card loading={loading}>
                  <Statistic title='手环总数' value={totalBracelets} valueStyle={{ color: "#3f8600" }} />
               </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
               <Card loading={loading}>
                  <Statistic title='在线手环' value={onlineBracelets} valueStyle={{ color: "#1890ff" }} />
               </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
               <Card loading={loading}>
                  <Statistic title='已分配手环' value={assignedBracelets} valueStyle={{ color: "#722ed1" }} />
               </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
               <Card loading={loading}>
                  <Statistic title='未分配手环' value={unassignedBracelets} valueStyle={{ color: "#fa8c16" }} />
               </Card>
            </Col>
         </Row>

         <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
               <Card
                  title='已分配手环'
                  extra={
                     <Button
                        type='link'
                        icon={<LinkOutlined />}
                        onClick={() => navigate("/dashboard/assigned-bracelets")}
                     >
                        查看详情
                     </Button>
                  }
                  style={{ height: "100%" }}
               >
                  <p>
                     已分配给人员的手环总数: <strong>{assignedBracelets}</strong> 个
                  </p>
                  <p>
                     占总手环数比例:{" "}
                     <strong>{totalBracelets > 0 ? Math.round((assignedBracelets / totalBracelets) * 100) : 0}%</strong>
                  </p>
                  <Button type='primary' onClick={() => navigate("/dashboard/assigned-bracelets")}>
                     查看已分配手环列表
                  </Button>
               </Card>
            </Col>
            <Col xs={24} sm={12}>
               <Card
                  title='未分配手环'
                  extra={
                     <Button
                        type='link'
                        icon={<LinkOutlined />}
                        onClick={() => navigate("/dashboard/unassigned-bracelets")}
                     >
                        查看详情
                     </Button>
                  }
                  style={{ height: "100%" }}
               >
                  <p>
                     未分配给人员的手环总数: <strong>{unassignedBracelets}</strong> 个
                  </p>
                  <p>
                     占总手环数比例:{" "}
                     <strong>
                        {totalBracelets > 0 ? Math.round((unassignedBracelets / totalBracelets) * 100) : 0}%
                     </strong>
                  </p>
                  <Button type='primary' onClick={() => navigate("/dashboard/unassigned-bracelets")}>
                     查看未分配手环列表
                  </Button>
               </Card>
            </Col>
         </Row>
      </div>
   );
};

export default AllBracelets;
