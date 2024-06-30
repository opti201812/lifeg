import React, { useState, useCallback } from "react";
import { Table, Button, Modal, Form, Input, Switch } from "antd";

interface Radar {
   id: number;
   ip: string;
   enabled: boolean;
   remark: string;
}

const RadarManagement: React.FC = () => {
   const [radars, setRadars] = useState<Radar[]>([]);
   const [isModalVisible, setIsModalVisible] = useState(false);
   const [editingRadar, setEditingRadar] = useState<Radar | null>(null);

   const handleAddRadar = useCallback(
      (radar: Radar) => {
         setRadars([...radars, radar]);
      },
      [radars]
   );

   const handleEditRadar = useCallback(
      (radar: Radar) => {
         setRadars(radars.map((r) => (r.id === radar.id ? radar : r)));
      },
      [radars]
   );

   const handleDeleteRadar = useCallback(
      (id: number) => {
         setRadars(radars.filter((r) => r.id !== id));
      },
      [radars]
   );

   const showModal = useCallback((radar: Radar | null) => {
      setEditingRadar(radar);
      setIsModalVisible(true);
   }, []);

   const handleOk = useCallback(
      (values: Radar) => {
         if (editingRadar) {
            handleEditRadar(values);
         } else {
            handleAddRadar({ ...values, id: radars.length + 1 });
         }
         setIsModalVisible(false);
      },
      [editingRadar, handleAddRadar, handleEditRadar, radars.length]
   );

   const handleCancel = useCallback(() => {
      setIsModalVisible(false);
   }, []);

   const columns = [
      { title: "编号", dataIndex: "id", key: "id" },
      { title: "IP地址", dataIndex: "ip", key: "ip" },
      {
         title: "启用监测",
         dataIndex: "enabled",
         key: "enabled",
         render: (enabled: boolean) => (enabled ? "是" : "否"),
      },
      { title: "备注", dataIndex: "remark", key: "remark" },
      {
         title: "操作",
         key: "action",
         render: (_: any, record: Radar) => (
            <>
               <Button onClick={() => showModal(record)}>编辑</Button>
               <Button onClick={() => handleDeleteRadar(record.id)}>删除</Button>
            </>
         ),
      },
   ];

   return (
      <div>
         <h2>雷达管理</h2>
         <Button type='primary' onClick={() => showModal(null)}>
            新增雷达
         </Button>
         <Table dataSource={radars} columns={columns} rowKey='id' />
         <Modal
            title={editingRadar ? "编辑雷达" : "新增雷达"}
            visible={isModalVisible}
            onCancel={handleCancel}
            footer={null}
         >
            <Form initialValues={editingRadar || { id: "", ip: "", enabled: false, remark: "" }} onFinish={handleOk}>
               <Form.Item label='编号' name='id' rules={[{ required: true, message: "请输入编号" }]}>
                  <Input />
               </Form.Item>
               <Form.Item label='IP地址' name='ip' rules={[{ required: true, message: "请输入IP地址" }]}>
                  <Input />
               </Form.Item>
               <Form.Item label='启用监测' name='enabled' valuePropName='checked'>
                  <Switch />
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

export default RadarManagement;
