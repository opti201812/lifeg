// components/RadarManagement/index.tsx
import React, { useState, useCallback, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Switch, message } from "antd";
import { settingSpace } from "../../styles/theme";
import { Radar } from "../../types";
import axios from "axios";
import config from "../../config";

const RadarManagement: React.FC = () => {
   const [form] = Form.useForm(); // Get a reference to the Form instance
   const [radars, setRadars] = useState<Radar[]>([]);
   const [isModalVisible, setIsModalVisible] = useState(false);
   const [editingRadar, setEditingRadar] = useState<Radar | { name: ""; url: ""; enabled: true; remark: "" }>({
      name: "",
      url: "",
      enabled: true,
      remark: "",
   });
   const [initialValues, setInitialValues] = useState<Radar | { name: ""; url: ""; enabled: true; remark: "" }>({
      name: "",
      url: "",
      enabled: true,
      remark: "",
   }); // Use state for initial values

   // Fetch radars on component mount
   useEffect(() => {
      const fetchRadars = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/radars`);
            setRadars(response.data || []);
         } catch (error) {
            console.error("Error fetching radars:", error);
            message.error("加载雷达列表失败！");
         }
      };
      fetchRadars();
   }, []);

   const handleAddRadar = useCallback(
      async (radar: Radar) => {
         try {
            const response = await axios.post(`${config.backend.url}/radars`, radar);
            setRadars([...radars, response.data]);
            setIsModalVisible(false);
            message.success("新增雷达成功");
         } catch (error) {
            console.error("Error adding radar:", error);
            if (axios.isAxiosError(error)) {
               message.error(error.response?.data?.error || "新增雷达失败！");
            } else {
               message.error("新增雷达失败！");
            }
         }
      },
      [radars]
   );

   const handleEditRadar = useCallback(
      async (radar: Radar) => {
         try {
            const response = await axios.put(`${config.backend.url}/radars/${editingRadar?.name}`, radar);
            setRadars(radars.map((r) => (r.name === radar.name ? response.data : r)));
            setIsModalVisible(false);
            message.success("更新雷达信息成功");
         } catch (error) {
            console.error("Error editing radar:", error);
            message.error("更新雷达信息失败！");
         }
      },
      [radars, editingRadar?.name]
   );

   const handleDeleteRadar = useCallback(
      async (name: string) => {
         // Change id to name
         try {
            await axios.delete(`${config.backend.url}/radars/${name}`);
            setRadars(radars.filter((r) => r.name !== name));
            message.success("删除雷达成功");
         } catch (error) {
            console.error("Error deleting radar:", error);
            message.error("删除雷达信息失败！");
         }
      },
      [radars]
   );

   const showModal = (radar?: Radar) => {
      form.resetFields(); // Reset form fields
      if (radar) {
         form.setFieldsValue(radar);
         setEditingRadar(radar);
         setInitialValues(radar);
      } else {
         setEditingRadar({ name: "", url: "", enabled: true, remark: "" });
         setInitialValues({ name: "", url: "", enabled: true, remark: "" });
      }
      setIsModalVisible(true);
   };

   const handleOk = useCallback(
      (values: Radar) => {
         if (editingRadar && editingRadar.name) {
            handleEditRadar(values);
         } else {
            handleAddRadar(values);
         }
         setIsModalVisible(false);
      },
      [editingRadar, handleAddRadar, handleEditRadar]
   );

   const handleCancel = useCallback(() => {
      setIsModalVisible(false);
   }, []);

   const columns = [
      { title: "编号", dataIndex: "name", key: "name" },
      { title: "URL地址", dataIndex: "url", key: "url" },
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
               <Button onClick={() => handleDeleteRadar(record.name)}>删除</Button> {/* Use name for delete */}
            </>
         ),
      },
   ];

   return (
      <div style={settingSpace}>
         <h2>雷达管理</h2>
         <Button type='primary' onClick={() => showModal({ id: 0, name: "", url: "", enabled: true, remark: "" })}>
            新增雷达
         </Button>
         <Table dataSource={radars} columns={columns} rowKey='name' />
         <Modal
            title={editingRadar && editingRadar.name ? "编辑雷达" : "新增雷达"}
            open={isModalVisible}
            onCancel={handleCancel}
            footer={null}
         >
            <Form initialValues={initialValues} form={form} onFinish={handleOk}>
               <Form.Item label='编号' name='name' rules={[{ required: true, message: "请输入编号" }]}>
                  <Input disabled={!!(editingRadar && editingRadar.name)} placeholder='请输入便于记忆的雷达编号' />
               </Form.Item>
               <Form.Item label='URL地址' name='url' rules={[{ required: true, message: "请输入URL地址" }]}>
                  <Input placeholder='请输入获取雷达数据的URL地址' />
               </Form.Item>
               <Form.Item label='启用' name='enabled' valuePropName='checked'>
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
