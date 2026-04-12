import React from "react";
import { Card, Row, Col, Button, Space } from "antd";
import { UserAddOutlined, ReloadOutlined } from "@ant-design/icons";

interface RegistrationHeaderProps {
   onAddNew: () => void;
   onRefresh: () => void;
}

const RegistrationHeader: React.FC<RegistrationHeaderProps> = ({ onAddNew, onRefresh }) => {
   return (
      <Card>
         <Row justify='space-between' align='middle'>
            <Col>
               <h2 style={{ margin: 0 }}>人员检录管理</h2>
            </Col>
            <Col>
               <Space>
                  <Button type='primary' icon={<UserAddOutlined />} onClick={onAddNew}>
                     新增检录
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={onRefresh}>
                     刷新
                  </Button>
               </Space>
            </Col>
         </Row>
      </Card>
   );
};

export default RegistrationHeader;

