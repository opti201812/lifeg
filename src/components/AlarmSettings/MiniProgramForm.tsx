import React, { useState, useEffect } from "react";
import { Form, Input, Button, Switch, Row, Col, Table, Popconfirm, message } from "antd";
import axios from "axios";
import config from "../../config";
import { AlertConfig, MiniConfig, OpenIdItem } from "../../types";

interface MiniProgramFormProps {
   initialValues: MiniConfig;
}

const MiniProgramForm: React.FC<MiniProgramFormProps> = ({ initialValues }) => {
   const [form] = Form.useForm();
   const [showAdditionalFields, setShowAdditionalFields] = useState<boolean>(initialValues.wechatEnabled); // State to control visibility
   const [dataSource, setDataSource] = useState<OpenIdItem[]>(initialValues.wechatOpenIdList || []); // State to manage OpenID list
   const [count, setCount] = useState<number>(
      initialValues.wechatOpenIdList ? initialValues.wechatOpenIdList.length : 0
   ); // State to manage row count
   const [editingKey, setEditingKey] = useState<string>(""); // State to manage editing row
   const isEditing = (record: OpenIdItem) => record?.key.toString() === editingKey;

   useEffect(() => {
      const fetchWechatNotificationConfig = async () => {
         try {
            const response = await axios.get(`${config.backend.url}/miniprogramconfig`);
            const values: MiniConfig = { ...initialValues }; // Initialize with defaults

            response.data.forEach((config: AlertConfig) => {
               const key = config.config_name as keyof MiniConfig; // Use keyof to ensure type safety
               if (key === "wechatEnabled") {
                  values[key] = config.value as boolean; // Convert string to boolean for wechatEnabled
                  setShowAdditionalFields(config.value as boolean); // Set showAdditionalFields state based on wechatEnabled
               }
               // Handle numerical values
               if (key === "wechatOpenIdList") {
                  values[key] = (config as any).value;
               }
            });
            form.setFieldsValue(values);
         } catch (error) {
            console.error("Error fetching Wechat config:", error);
            message.error("加载微信设置失败！");
         }
      };

      fetchWechatNotificationConfig();
   }, []);

   const handleFinish = async (values: MiniConfig) => {
      const updatedValues = {
         ...values,
         wechatOpenIdList: dataSource, // Include the OpenID list in the form values
      };

      try {
         await axios.put(`${config.backend.url}/miniprogramconfig`, updatedValues);
         message.success("配置已保存");
      } catch (error) {
         message.error("保存配置失败");
      }
   };

   const handleIsEnabledChange = (value: boolean) => {
      setShowAdditionalFields(value); // Update showAdditionalFields state
   };

   const handleDelete = (key: React.Key) => {
      const currentData = form.getFieldValue("wechatOpenIdList") || [];
      const newData = currentData.filter((item: OpenIdItem) => item.key !== key);

      form.setFieldsValue({ wechatOpenIdList: newData });
      setDataSource(newData);
   };

   const handleAdd = () => {
      const newData: OpenIdItem = {
         key: count,
         openid: "",
         name: "",
      };
      const currentData = form.getFieldValue("wechatOpenIdList") || [];
      const updatedData = [...currentData, newData];

      form.setFieldsValue({ wechatOpenIdList: updatedData });
      setDataSource(updatedData);
      setCount(count + 1);
      setEditingKey(count.toString());
   };

   const handleSave = async (key: React.Key) => {
      try {
         // Validate only the fields related to the row being edited
         const row = await form.validateFields();
         const newData = [...form.getFieldValue("wechatOpenIdList")];
         const index = newData.findIndex((item) => key === item.key);

         if (index > -1) {
            const item = newData[index];
            const updatedItem = { ...item };

            // Update each field in the item
            Object.keys(row).forEach((field) => {
               const [recordKey, dataIndex] = field.split("_");
               if (recordKey == key) {
                  updatedItem[dataIndex] = row[field];
               }
            });

            newData.splice(index, 1, updatedItem);
            form.setFieldsValue({ wechatOpenIdList: newData });
            setDataSource(newData);
            setEditingKey("");
         } else {
            newData.push(row);
            form.setFieldsValue({ wechatOpenIdList: newData });
            setDataSource(newData);
            setEditingKey("");
         }
      } catch (errInfo) {
         console.log("Validate Failed:", errInfo);
      }
   };

   const EditableCell: React.FC<{
      title: React.ReactNode;
      editable: boolean;
      children: React.ReactNode;
      dataIndex: string;
      record: OpenIdItem;
      handleSave: (record: OpenIdItem) => void;
   }> = ({ title, editable, children, dataIndex, record, handleSave, ...restProps }) => {
      const editableCell = isEditing(record);

      let childNode = children;

      if (editable && editableCell) {
         childNode = (
            <Form.Item
               name={`${record.key}_${dataIndex}`} // Ensure unique field names
               style={{ margin: 0 }}
               rules={[{ required: true, message: `${title} 是必填项` }]}
            >
               <Input />
            </Form.Item>
         );
      }

      return <td {...restProps}>{childNode}</td>;
   };

   const columns = [
      {
         title: "Key",
         dataIndex: "key",
         editable: false,
      },
      {
         title: "OpenID",
         dataIndex: "openid",
         editable: true,
      },
      {
         title: "Name",
         dataIndex: "name",
         editable: true,
      },
      {
         title: "操作",
         dataIndex: "operation",
         render: (_: any, record: OpenIdItem) => {
            const editable = isEditing(record);
            return editable ? (
               <span>
                  <Button onClick={() => handleSave(record.key)} type='link' style={{ marginRight: 8 }}>
                     确认
                  </Button>
                  <Popconfirm title='确定取消?' onConfirm={() => setEditingKey("")}>
                     <a>取消</a>
                  </Popconfirm>
               </span>
            ) : (
               <span>
                  <Button onClick={() => setEditingKey(record.key.toString())} type='link' style={{ marginRight: 8 }}>
                     编辑
                  </Button>
                  <Popconfirm title='确定删除?' onConfirm={() => handleDelete(record.key)}>
                     <a>删除</a>
                  </Popconfirm>
               </span>
            );
         },
      },
   ];

   const mergedColumns = columns.map((col) => {
      if (!col.editable) {
         return col;
      }

      return {
         ...col,
         onCell: (record: OpenIdItem) => ({
            record,
            editable: col.editable,
            dataIndex: col.dataIndex,
            title: col.title,
            handleSave,
         }),
      };
   });
   return (
      <Form form={form} name='wechat-management' onFinish={handleFinish} initialValues={initialValues}>
         <Row gutter={16}>
            <Col span={12}>
               <Form.Item
                  label='是否启用'
                  name='wechatEnabled'
                  valuePropName='checked'
                  rules={[{ required: true, message: "请选择是否启用微信报警消息通知" }]}
               >
                  <Switch onChange={handleIsEnabledChange} />
               </Form.Item>
            </Col>
         </Row>

         {showAdditionalFields && (
            <>
               <Row gutter={16}>
                  <Col span={24}>
                     <Button onClick={handleAdd} type='primary' style={{ marginBottom: 16 }}>
                        添加OpenID
                     </Button>
                     <Form.Item name='wechatEnabledOpenIdList'>
                        <Table
                           components={{
                              body: {
                                 cell: EditableCell,
                              },
                           }}
                           bordered
                           dataSource={form.getFieldValue("wechatOpenIdList")}
                           columns={mergedColumns}
                           rowClassName='editable-row'
                           pagination={false}
                        />
                     </Form.Item>
                  </Col>
               </Row>
            </>
         )}
         <Form.Item wrapperCol={{ span: 24 }}>
            <Button type='primary' htmlType='submit'>
               保存设置
            </Button>
         </Form.Item>
      </Form>
   );
};

export default MiniProgramForm;
