import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Form, Input, Select, Row, Col, Button, Divider, Space, Modal, Spin, Card, Statistic, message } from "antd";
import { FormInstance } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { MEDICAL_HISTORIES } from "../../../types";
import { fillFormFromBracelet } from "../utils";
import { BraceletDevice } from "../types";
import {
   csmWebSocketManager,
   BraceletData,
   OximeterData,
} from "../../../services/CSMWebSocketManager";

const { Option } = Select;

interface RegistrationFormEnhancedProps {
   form: FormInstance;
   availableBracelets: string[];
   availableOximeters: string[];
   oximeterEnabled: boolean;
   braceletEnabled: boolean;
   oximeterId?: string | null;
   braceletId?: string | null;
   onOximeterToggle: (deviceId?: string) => void;
   onBraceletToggle: (deviceId?: string) => void;
   onCancel: () => void;
   onSubmit: (values: any) => void;
   loading: boolean;
   isEditing: boolean;
   onLoadBraceletData?: (braceletId: string) => Promise<BraceletDevice | null>;
   editingPersonnelId?: number;
}

interface ThresholdField {
   label: string;
   field: string;
}

const THRESHOLD_FIELDS: ThresholdField[][] = [
   [
      { label: "心率 (bpm)", field: "heartRateBase" },
      { label: "呼吸率 (rpm)", field: "breathRateBase" },
      { label: "静息心率 (bpm)", field: "restingHeartRateBase" },
      { label: "静息呼吸率 (rpm)", field: "restingBreathRateBase" },
   ],
   [
      { label: "血氧饱和度 (%)", field: "spo2Base" },
      { label: "体温 (℃)", field: "bodyTemperatureBase" },
      { label: "收缩压 (mmHg)", field: "systolicPressureBase" },
      { label: "舒张压 (mmHg)", field: "diastolicPressureBase" },
   ],
];

const RegistrationFormEnhanced: React.FC<RegistrationFormEnhancedProps> = ({
   form,
   availableBracelets,
   availableOximeters,
   oximeterEnabled,
   braceletEnabled,
   oximeterId,
   braceletId,
   onOximeterToggle,
   onBraceletToggle,
   onCancel,
   onSubmit,
   loading,
   isEditing,
   onLoadBraceletData,
   editingPersonnelId,
}) => {
   const [loadingData, setLoadingData] = useState(false);
   const [hasAvailableOximeter, setHasAvailableOximeter] = useState(false);
   const [hasAvailableBracelet, setHasAvailableBracelet] = useState(false);
   const [userModifiedThresholds, setUserModifiedThresholds] = useState<Set<string>>(new Set());
   const [braceletRealTimeData, setBraceletRealTimeData] = useState<BraceletData | null>(null);
   const [oximeterRealTimeData, setOximeterRealTimeData] = useState<OximeterData | null>(null);

   const allThresholdFields = useMemo(() => THRESHOLD_FIELDS.flat(), []);

   useEffect(() => {
      setHasAvailableOximeter(availableOximeters.length > 0);
      setHasAvailableBracelet(availableBracelets.length > 0);
   }, [availableOximeters, availableBracelets]);

   useEffect(() => {
      const handleBraceletData = (data: BraceletData) => {
         setBraceletRealTimeData(data);
      };

      const handleOximeterData = (data: OximeterData) => {
         setOximeterRealTimeData(data);
      };

      csmWebSocketManager.setCallbacks({
         onBraceletData: handleBraceletData,
         onOximeterData: handleOximeterData,
      });

      csmWebSocketManager.connectOximeter();
      csmWebSocketManager.connectBracelet();

      return () => {
         if (braceletId) {
            csmWebSocketManager.unsubscribeDevice(braceletId, "bracelet");
         }
         if (oximeterId) {
            csmWebSocketManager.unsubscribeDevice(oximeterId, "oximeter");
         }
      };
   }, []);

   useEffect(() => {
      if (braceletEnabled && braceletId) {
         csmWebSocketManager.subscribeDevice(braceletId, "bracelet");
      } else if (!braceletEnabled && braceletId) {
         csmWebSocketManager.unsubscribeDevice(braceletId, "bracelet");
         setBraceletRealTimeData(null);
      }
   }, [braceletEnabled, braceletId]);

   useEffect(() => {
      if (oximeterEnabled && oximeterId) {
         csmWebSocketManager.subscribeDevice(oximeterId, "oximeter");
      } else if (!oximeterEnabled && oximeterId) {
         csmWebSocketManager.unsubscribeDevice(oximeterId, "oximeter");
         setOximeterRealTimeData(null);
      }
   }, [oximeterEnabled, oximeterId]);

   const handleBraceletSelect = async (selectedBraceletId: string | undefined) => {
      if (!selectedBraceletId || !onLoadBraceletData) return;
      try {
         setLoadingData(true);
         const braceletData = await onLoadBraceletData(selectedBraceletId);
         if (braceletData) {
            const filledData = fillFormFromBracelet(braceletData);
            if (filledData) {
               form.setFieldsValue(filledData);
            }
         }
      } catch (error) {
         console.error("获取手环数据失败:", error);
      } finally {
         setLoadingData(false);
      }
   };

   const handleOximeterToggle = async () => {
      const deviceId = oximeterId || availableOximeters[0];
      if (!oximeterEnabled) {
         if (!hasAvailableOximeter) {
            message.warning("暂无可用血氧仪设备");
            return;
         }
         if (!deviceId) {
            message.warning("未找到血氧仪设备ID");
            return;
         }
         Modal.confirm({
            title: "连接血氧仪",
            content: "确认要连接血氧仪吗？",
            okText: "确认",
            cancelText: "取消",
            async onOk() {
               try {
                  setLoadingData(true);
                  const success = await csmWebSocketManager.connectOximeter();
                  if (success) {
                     message.success("血氧仪连接成功");
                     onOximeterToggle(deviceId);
                  } else {
                     message.error("血氧仪连接失败");
                  }
               } catch (error) {
                  console.error("连接血氧仪出错:", error);
                  message.error("连接血氧仪出错");
               } finally {
                  setLoadingData(false);
               }
            },
         });
      } else {
         onOximeterToggle(deviceId);
      }
   };

   const handleBraceletToggle = async () => {
      const deviceId = braceletId || availableBracelets[0];
      if (!braceletEnabled) {
         if (!hasAvailableBracelet) {
            message.warning("暂无可用手环设备");
            return;
         }
         if (!deviceId) {
            message.warning("未找到手环设备ID");
            return;
         }
         Modal.confirm({
            title: "连接手环",
            content: "确认要连接手环吗？",
            okText: "确认",
            cancelText: "取消",
            async onOk() {
               try {
                  setLoadingData(true);
                  const success = await csmWebSocketManager.connectBracelet();
                  if (success) {
                     message.success("手环连接成功");
                     onBraceletToggle(deviceId);
                  } else {
                     message.error("手环连接失败");
                  }
               } catch (error) {
                  console.error("连接手环出错:", error);
                  message.error("连接手环出错");
               } finally {
                  setLoadingData(false);
               }
            },
         });
      } else {
         onBraceletToggle(deviceId);
      }
   };

   const handleRefreshOximeterData = useCallback(() => {
      message.info("实时数据将自动更新");
   }, []);

   const handleRefreshBraceletData = useCallback(() => {
      message.info("实时数据将自动更新");
   }, []);

   const handleFillThresholds = useCallback(() => {
      const allData = { ...braceletRealTimeData, ...oximeterRealTimeData };
      if (!allData || Object.keys(allData).length === 0) {
         message.warning("暂无实时数据");
         return;
      }

      const baseValues: Record<string, number> = {};

      const shouldFill = (field: string, value: number | undefined): boolean => {
         if (value === undefined || value === 0) return false;
         if (userModifiedThresholds.has(field)) return false;
         return true;
      };

      if (shouldFill("heartRateBase", allData.heartRate) && allData.heartRate) {
         baseValues.heartRateBase = allData.heartRate;
      }
      if (shouldFill("breathRateBase", allData.breathRate) && allData.breathRate) {
         baseValues.breathRateBase = allData.breathRate;
      }
      if (shouldFill("spo2Base", allData.spo2) && allData.spo2) {
         baseValues.spo2Base = allData.spo2;
      }
      if (shouldFill("bodyTemperatureBase", allData.bodyTemperature) && allData.bodyTemperature) {
         baseValues.bodyTemperatureBase = allData.bodyTemperature;
      }
      if (shouldFill("systolicPressureBase", allData.systolicPressure) && allData.systolicPressure) {
         baseValues.systolicPressureBase = allData.systolicPressure;
      }
      if (shouldFill("diastolicPressureBase", allData.diastolicPressure) && allData.diastolicPressure) {
         baseValues.diastolicPressureBase = allData.diastolicPressure;
      }

      if (shouldFill("restingHeartRateBase", allData.heartRate) && allData.heartRate && baseValues.heartRateBase) {
         baseValues.restingHeartRateBase = baseValues.heartRateBase;
      }
      if (shouldFill("restingBreathRateBase", allData.breathRate) && allData.breathRate && baseValues.breathRateBase) {
         baseValues.restingBreathRateBase = baseValues.breathRateBase;
      }

      const currentValues = form.getFieldsValue(true);
      const existingValues: Record<string, number> = {};
      allThresholdFields.forEach((field) => {
         if (currentValues[field.field] !== undefined) {
            existingValues[field.field] = currentValues[field.field];
         }
      });

      const finalValues = { ...existingValues, ...baseValues };
      form.setFieldsValue(finalValues);

      const filledCount = Object.keys(baseValues).length;
      if (filledCount > 0) {
         message.success(`已填充 ${filledCount} 个基准值`);
      } else {
         message.info("所有基准值已由用户修改或无有效数据");
      }
   }, [braceletRealTimeData, oximeterRealTimeData, userModifiedThresholds, form, allThresholdFields]);

   const handleThresholdChange = useCallback((fieldName: string) => {
      setUserModifiedThresholds((prev) => new Set(prev).add(fieldName));
   }, []);

   const handleResetThresholds = useCallback(() => {
      const resetFields: Record<string, undefined> = {};
      allThresholdFields.forEach((field) => {
         resetFields[field.field] = undefined;
      });
      form.setFieldsValue(resetFields);
      setUserModifiedThresholds(new Set());
   }, [form, allThresholdFields]);

   return (
      <Spin spinning={loadingData} tip='加载设备数据中...'>
         <Form form={form} layout='vertical' onFinish={onSubmit}>
            <Divider orientation='left'>人员基础信息</Divider>
            <Row gutter={16}>
               <Col span={8}>
                  <Form.Item label='姓名' name='name' rules={[{ required: true, message: "请输入姓名" }]}>
                     <Input placeholder='请输入姓名' />
                  </Form.Item>
               </Col>
               <Col span={8}>
                  <Form.Item
                     label='身份证号'
                     name='idNumber'
                     rules={[
                        { required: true, message: "请输入身份证号" },
                        { pattern: /^\d{17}[\dXx]$/, message: "请输入有效的身份证号" },
                     ]}
                  >
                     <Input placeholder='请输入身份证号' />
                  </Form.Item>
               </Col>
               <Col span={4}>
                  <Form.Item label='性别' name='gender' rules={[{ required: true, message: "请选择性别" }]}>
                     <Select placeholder='请选择性别'>
                        <Option value='male'>男</Option>
                        <Option value='female'>女</Option>
                     </Select>
                  </Form.Item>
               </Col>
               <Col span={4}>
                  <Form.Item label='年龄' name='age' rules={[{ required: true, message: "请输入年龄" }]}>
                     <Input type='number' placeholder='年龄' min={1} max={120} />
                  </Form.Item>
               </Col>
            </Row>

            <Row gutter={16}>
               <Col span={12}>
                  <Form.Item label='既往病史' name='medicalHistory'>
                     <Select mode='multiple' placeholder='请选择既往病史'>
                        {MEDICAL_HISTORIES.map((item) => (
                           <Option key={item.value} value={item.value}>
                              {item.label}
                           </Option>
                        ))}
                     </Select>
                  </Form.Item>
               </Col>
               <Col span={12}>
                  <Form.Item label='备注' name='remarks'>
                     <Input.TextArea rows={3} placeholder='请输入备注信息' />
                  </Form.Item>
               </Col>
            </Row>

            <Divider orientation='left'>设备分配</Divider>
            <Row gutter={16}>
               <Col span={12}>
                  <Form.Item label='手环选择' name='braceletId'>
                     <Select
                        placeholder='请选择手环（可选）'
                        allowClear
                        showSearch
                        onChange={handleBraceletSelect}
                     >
                        {availableBracelets.map((bracelet) => (
                           <Option key={bracelet} value={bracelet}>
                              {bracelet}
                           </Option>
                        ))}
                     </Select>
                  </Form.Item>
               </Col>
               <Col span={12}>
                  <Form.Item label='血氧仪'>
                     <Button
                        type={oximeterEnabled ? "default" : "primary"}
                        danger={oximeterEnabled}
                        onClick={handleOximeterToggle}
                        disabled={!oximeterEnabled && !hasAvailableOximeter}
                     >
                        {oximeterEnabled ? "断开血氧仪" : "连接血氧仪"}
                     </Button>
                  </Form.Item>
               </Col>
            </Row>

            {(braceletEnabled || oximeterEnabled) && (
               <>
                  <Divider orientation='left'>设备实时数据</Divider>
                  <Card size='small' style={{ marginBottom: 16 }}>
                     <Row justify='space-between' align='middle' style={{ marginBottom: 16 }}>
                        <Col>
                           <Space>
                              {braceletEnabled && (
                                 <span style={{ fontWeight: 500 }}>手环: {braceletId || "未连接"}</span>
                              )}
                              {braceletEnabled && oximeterEnabled && <span style={{ margin: "0 8px" }}>|</span>}
                              {oximeterEnabled && (
                                 <span style={{ fontWeight: 500 }}>血氧仪: {oximeterId || "未连接"}</span>
                              )}
                           </Space>
                        </Col>
                        <Col>
                           <Space>
                              <Button icon={<ReloadOutlined />} size='small' onClick={handleRefreshBraceletData}>
                                 刷新
                              </Button>
                              <Button type='primary' size='small' onClick={handleFillThresholds}>
                                 填充到阈值
                              </Button>
                           </Space>
                        </Col>
                     </Row>
                     <Row gutter={16}>
                        {braceletEnabled && (
                           <>
                              <Col span={6}>
                                 <Statistic
                                    title='心率'
                                    value={braceletRealTimeData?.heartRate ?? "--"}
                                    suffix='bpm'
                                    valueStyle={{ color: braceletRealTimeData?.heartRate ? "#cf1322" : undefined }}
                                 />
                              </Col>
                              <Col span={6}>
                                 <Statistic
                                    title='血氧'
                                    value={braceletRealTimeData?.spo2 ?? "--"}
                                    suffix='%'
                                    valueStyle={{ color: braceletRealTimeData?.spo2 ? "#3f8600" : undefined }}
                                 />
                              </Col>
                              <Col span={6}>
                                 <Statistic
                                    title='体温'
                                    value={braceletRealTimeData?.bodyTemperature?.toFixed(1) ?? "--"}
                                    suffix='℃'
                                 />
                              </Col>
                              <Col span={6}>
                                 <Statistic
                                    title='血压'
                                    value={
                                       braceletRealTimeData?.systolicPressure && braceletRealTimeData?.diastolicPressure
                                          ? `${braceletRealTimeData.systolicPressure}/${braceletRealTimeData.diastolicPressure}`
                                          : "--"
                                    }
                                    suffix='mmHg'
                                 />
                              </Col>
                           </>
                        )}
                        {oximeterEnabled && !braceletEnabled && (
                           <>
                              <Col span={6}>
                                 <Statistic
                                    title='血氧饱和度'
                                    value={oximeterRealTimeData?.spo2 ?? "--"}
                                    suffix='%'
                                    valueStyle={{ color: oximeterRealTimeData?.spo2 ? "#3f8600" : undefined }}
                                 />
                              </Col>
                              <Col span={6}>
                                 <Statistic
                                    title='心率'
                                    value={oximeterRealTimeData?.heartRate ?? "--"}
                                    suffix='bpm'
                                    valueStyle={{ color: oximeterRealTimeData?.heartRate ? "#cf1322" : undefined }}
                                 />
                              </Col>
                           </>
                        )}
                     </Row>
                  </Card>
               </>
            )}

            <Divider orientation='left'>监测基准值设置</Divider>
            {THRESHOLD_FIELDS.map((row, rowIndex) => (
               <Row key={rowIndex} gutter={16} style={{ marginBottom: 16 }}>
                  {row.map((field) => (
                     <Col key={field.field} span={6}>
                        <Form.Item label={field.label}>
                           <Form.Item name={field.field} noStyle>
                              <Input
                                 type='number'
                                 placeholder='请输入基准值'
                                 onChange={() => handleThresholdChange(field.field)}
                              />
                           </Form.Item>
                        </Form.Item>
                     </Col>
                  ))}
               </Row>
            ))}
            <Row justify='end' style={{ marginBottom: 16 }}>
               <Button type='link' onClick={handleResetThresholds}>
                  重置为默认值
               </Button>
            </Row>

            <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
               <Space>
                  <Button onClick={onCancel}>取消</Button>
                  <Button type='primary' htmlType='submit' loading={loading}>
                     {isEditing ? "更新" : "提交"}
                  </Button>
               </Space>
            </Form.Item>
         </Form>
      </Spin>
   );
};

export default RegistrationFormEnhanced;
