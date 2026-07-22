import React, { useState, useEffect, useMemo } from "react";
import {
   Table,
   Button,
   Input,
   DatePicker,
   Select,
   Space,
   message,
   Form,
   Row,
   Col,
   Tooltip,
   Tabs,
} from "antd";
import { SearchOutlined, ReloadOutlined, DownloadOutlined, PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import axios, { AxiosError } from "axios";
import config from "../../config";
import * as ExcelJS from "exceljs";
import { normalizeRadarDistanceToMeters } from "../../shared/src/utils/radarDistance";

const { RangePicker } = DatePicker;

interface HistoricalData {
   personnelId: number;
   name: string;
   heartRate: number;
   breathRate: number;
   distance: number;
   dateTime: string;
   time: string;
   // 新增字段
   systolicPressure?: number;
   diastolicPressure?: number;
   spo2?: number;
   bodyTemperature?: number;
   sdnn?: number;
   rmssd?: number;
   pnn50?: number;
   lfPower?: number;
   hfPower?: number;
   lfHfRatio?: number;
   breathRateVariabilitySD?: number;
   breathAmplitudeVariabilityCV?: number;
   stressEmotion?: number;
   fatigueTolerance?: number;
   sleepQuality?: number;
   heartAttackRisk?: number;
   deepSleepDuration?: number;
   continuousDeepSleep?: number;
   lightSleepDuration?: number;
   awakeDuration?: number;
   totalSleepDuration?: number;
}

const HistoryData: React.FC = () => {
   const [dataCategory, setDataCategory] = useState<string>("basic"); // 数据类别tab
   const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
   const [personnelOptions, setPersonnelOptions] = useState<{ value: number; key: number; label: string }[]>([]);
   const [nameOptions, setNameOptions] = useState<{ value: number; key: number; label: string }[]>([]);
   const [idNumberOptions, setIdNumberOptions] = useState<{ value: string; key: string; label: string }[]>([]);
   const [form] = Form.useForm();
   const [filters, setFilters] = useState<{
      personnelId: number | null;
      name: number | null;
      idNumber: string;
      dateRange: dayjs.Dayjs[] | null; // 通用起止时间
      sleepDate?: dayjs.Dayjs | null; // 睡眠分析：仅选日期
   }>({
      personnelId: null,
      name: null,
      idNumber: "",
      dateRange: null,
      sleepDate: null,
   });
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      const fetchPersonnelOptions = async () => {
         try {
            // TODO: 实际API调用
            const response = await axios.get(`${config.backend.url}/personnel`);
            const personnelData = response.data?.data || response.data || [];
            const options = personnelData.map((person: any) => ({
               value: person.id,
               key: person.id,
               label: person.id,
            }));
            setPersonnelOptions(options);

            const names = personnelData.map((person: any) => ({
               value: person.id,
               key: person.id,
               label: person.name,
            }));
            setNameOptions(names);

            const idNumbers = personnelData
               .filter((person: any) => person.id_number && person.id_number.trim() !== "")
               .map((person: any) => ({
                  value: person.id,
                  key: person.id,
                  label: person.id_number,
               }));
            setIdNumberOptions(idNumbers);
         } catch (error) {
            console.error("Error fetching personnel options:", error);
            message.error("获取人员信息失败！");
         }
      };

      fetchPersonnelOptions();
   }, []);

   const handleSearch = async () => {
      if (!filters.personnelId && !filters.name && !filters.idNumber) {
         message.warning("请选择人员编号或姓名或身份证号");
         return;
      }

      setLoading(true);
      try {
         // TODO: 根据dataCategory参数请求不同类型的历史数据
         const queryParams = new URLSearchParams();
         queryParams.append("category", dataCategory);

         if (filters.personnelId) {
            queryParams.append("personnelId", filters.personnelId.toString());
         } else if (filters.name) {
            queryParams.append("personnelId", filters.name.toString());
         } else if (filters.idNumber) {
            queryParams.append("personnelId", filters.idNumber.toString());
         }

         if (dataCategory === "sleep") {
            // 睡眠分析：仅选日期，起止为 当天08:00 ～ 次日08:00
            if (!filters.sleepDate) {
               message.warning("请选择日期");
               setLoading(false);
               return;
            }
            const start = filters.sleepDate.hour(8).minute(0).second(0);
            const end = filters.sleepDate.add(1, "day").hour(8).minute(0).second(0);
            queryParams.append("startDate", start.format("YYYY-MM-DD HH:mm:ss"));
            queryParams.append("endDate", end.format("YYYY-MM-DD HH:mm:ss"));
         } else if (filters.dateRange && filters.dateRange.length === 2) {
            queryParams.append("startDate", filters.dateRange[0].format("YYYY-MM-DD HH:mm:ss"));
            queryParams.append("endDate", filters.dateRange[1].format("YYYY-MM-DD HH:mm:ss"));
         }

         // 调用真实API获取历史数据
         const response = await axios.get(`${config.backend.url}/history`, {
            params: Object.fromEntries(queryParams),
         });

         // 辅助函数：安全地解析数值，返回number或undefined
         const safeParseFloat = (value: any): number | undefined => {
            if (value === null || value === undefined || value === "" || value === "-") {
               return undefined;
            }
            const parsed = parseFloat(value);
            return isNaN(parsed) ? undefined : parsed;
         };

         // 处理API响应数据，映射字段名称
         const processedData = (response.data || []).map((item: any) => ({
            personnelId: item.person_id || item.personnelId,
            name: item.name || "未知",
            dateTime: item.time,
            time: dayjs(item.time).format("HH:mm:ss"),
            // 基础体征 - 使用 radar_heart_rate 作为主要心率
            heartRate: safeParseFloat(item.radar_heart_rate) ?? safeParseFloat(item.bracelet_heart_rate) ?? 0,
            breathRate: safeParseFloat(item.breath_rate) ?? 0,
            // 兼容新旧后端：>5 按厘米折算到米，≤5 认为已是米
            distance: normalizeRadarDistanceToMeters(item.distance) ?? 0,
            // 血压
            systolicPressure: safeParseFloat(item.bracelet_systolic_pressure) ?? 0,
            diastolicPressure: safeParseFloat(item.bracelet_diastolic_pressure) ?? 0,
            // 血氧
            spo2: safeParseFloat(item.oximeter_spo2) ?? safeParseFloat(item.bracelet_blood_oxygen) ?? 0,
            // 体温
            bodyTemperature: safeParseFloat(item.bracelet_body_temperature) ?? 0,
            // 心率分析
            sdnn: safeParseFloat(item.sdnn) ?? 0,
            rmssd: safeParseFloat(item.rmssd) ?? 0,
            pnn50: safeParseFloat(item.pnn50) ?? 0,
            lfPower: safeParseFloat(item.lf_power) ?? 0,
            hfPower: safeParseFloat(item.hf_power) ?? 0,
            lfHfRatio: safeParseFloat(item.lf_hf_ratio) ?? 0,
            breathRateVariabilitySD: safeParseFloat(item.breath_rate_variability_sd) ?? 0,
            breathAmplitudeVariabilityCV: safeParseFloat(item.breath_amplitude_variability_cv) ?? 0,
            // 综合评测
            stressEmotion: safeParseFloat(item.stress_emotion) ?? 0,
            fatigueTolerance: safeParseFloat(item.fatigue_tolerance) ?? 0,
            sleepQuality: safeParseFloat(item.sleep_quality) ?? 0,
            heartAttackRisk: safeParseFloat(item.heart_attack_risk) ?? 0,
            // 睡眠分析
            deepSleepDuration: safeParseFloat(item.deep_sleep_duration) ?? 0,
            continuousDeepSleep: safeParseFloat(item.max_continuous_deep_sleep) ?? 0,
            lightSleepDuration: safeParseFloat(item.light_sleep_duration) ?? 0,
            awakeDuration: safeParseFloat(item.awake_duration) ?? 0,
            totalSleepDuration: safeParseFloat(item.total_sleep_duration) ?? 0,
         }));

         setHistoricalData(processedData);
         if (processedData.length === 0) {
            message.info("未找到符合条件的历史数据");
         } else {
            message.success(`成功加载 ${processedData.length} 条历史数据`);
         }
      } catch (error) {
         console.error("Error fetching historical data:", error);
         if (axios.isAxiosError(error)) {
            if (error.response?.status === 404) {
               message.warning("未找到该人员的历史数据");
            } else {
               message.error(`获取历史数据失败: ${error.response?.statusText || error.message}`);
            }
         } else {
            message.error("获取历史数据失败！");
         }
      } finally {
         setLoading(false);
      }
   };

   const handleReset = () => {
      setFilters({
         personnelId: null,
         name: null,
         idNumber: "",
         dateRange: null,
         sleepDate: null,
      });
      form.resetFields();
      setHistoricalData([]);
   };

   const handleExport = async () => {
      if (historicalData.length === 0) {
         message.warning("没有数据可导出");
         return;
      }

      try {
         // 创建新的工作簿
         const workbook = new ExcelJS.Workbook();
         const worksheet = workbook.addWorksheet(getSheetName());

         // 准备导出数据
         const exportData = historicalData.map((item) => {
            const baseData: any = {
               人员编号: item.personnelId,
               姓名: item.name,
               时间: item.dateTime,
            };

            // 根据类别添加不同字段
            if (dataCategory === "basic") {
               baseData["心率"] = item.heartRate?.toFixed(1);
               baseData["呼吸率"] = item.breathRate?.toFixed(1);
               baseData["收缩压"] = item.systolicPressure?.toFixed(0);
               baseData["舒张压"] = item.diastolicPressure?.toFixed(0);
               baseData["血氧"] = item.spo2?.toFixed(1);
               baseData["体温"] = item.bodyTemperature?.toFixed(1);
            } else if (dataCategory === "analysis") {
               baseData["SDNN"] = item.sdnn?.toFixed(1);
               baseData["RMSSD"] = item.rmssd?.toFixed(1);
               baseData["pNN50"] = item.pnn50?.toFixed(1);
               baseData["LF"] = item.lfPower?.toFixed(0);
               baseData["HF"] = item.hfPower?.toFixed(0);
               baseData["LF/HF"] = item.lfHfRatio?.toFixed(2);
            } else if (dataCategory === "sleep") {
               baseData["深睡时长(分)"] = item.deepSleepDuration?.toFixed(0);
               baseData["连续深睡(分)"] = item.continuousDeepSleep?.toFixed(0);
               baseData["浅睡时长(分)"] = item.lightSleepDuration?.toFixed(0);
               baseData["清醒时长(分)"] = item.awakeDuration?.toFixed(0);
               baseData["睡眠总时长(分)"] = item.totalSleepDuration?.toFixed(0);
               baseData["睡眠质量分数"] = item.sleepQuality?.toFixed(0);
            } else if (dataCategory === "comprehensive") {
               baseData["压力值"] = item.stressEmotion?.toFixed(0);
               baseData["疲劳耐受"] = item.fatigueTolerance?.toFixed(0);
               baseData["睡眠质量"] = item.sleepQuality?.toFixed(0);
               baseData["心梗风险"] = item.heartAttackRisk?.toFixed(2);
            }

            return baseData;
         });

         // 添加表头
         const headers = Object.keys(exportData[0]);
         worksheet.addRow(headers);

         // 设置表头样式
         const headerRow = worksheet.getRow(1);
         headerRow.font = { bold: true };
         headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE6E6FA" },
         };

         // 添加数据行
         exportData.forEach((row: any) => {
            const values = headers.map((header) => row[header]);
            worksheet.addRow(values);
         });

         // 自动调整列宽
         worksheet.columns.forEach((column) => {
            if (column && column.eachCell) {
               let maxLength = 0;
               column.eachCell({ includeEmpty: true }, (cell) => {
                  const columnLength = cell.value ? cell.value.toString().length : 10;
                  if (columnLength > maxLength) {
                     maxLength = columnLength;
                  }
               });
               column.width = Math.min(maxLength + 2, 20);
            }
         });

         // 创建第二个工作表用于图表
         const chartWorksheet = workbook.addWorksheet("数据图表");

         // 准备图表数据：只包含数值型字段（排除状态类数据）
         const numericFields: { key: keyof HistoricalData; label: string }[] = [];

         if (dataCategory === "basic") {
            numericFields.push(
               { key: "heartRate", label: "心率" },
               { key: "breathRate", label: "呼吸率" },
               { key: "systolicPressure", label: "收缩压" },
               { key: "diastolicPressure", label: "舒张压" },
               { key: "spo2", label: "血氧" },
               { key: "bodyTemperature", label: "体温" }
            );
         } else if (dataCategory === "analysis") {
            numericFields.push(
               { key: "sdnn", label: "SDNN" },
               { key: "rmssd", label: "RMSSD" },
               { key: "pnn50", label: "pNN50" },
               { key: "lfPower", label: "LF功率" },
               { key: "hfPower", label: "HF功率" },
               { key: "lfHfRatio", label: "LF/HF" },
               { key: "breathRateVariabilitySD", label: "呼吸SD" },
               { key: "breathAmplitudeVariabilityCV", label: "呼吸CV" }
            );
         } else if (dataCategory === "sleep") {
            numericFields.push(
               { key: "deepSleepDuration", label: "深睡时长(分)" },
               { key: "continuousDeepSleep", label: "连续深睡(分)" },
               { key: "lightSleepDuration", label: "浅睡时长(分)" },
               { key: "awakeDuration", label: "清醒时长(分)" },
               { key: "totalSleepDuration", label: "睡眠总时长(分)" },
               { key: "sleepQuality", label: "睡眠质量分数" }
            );
         } else if (dataCategory === "comprehensive") {
            numericFields.push(
               { key: "stressEmotion", label: "压力值" },
               { key: "fatigueTolerance", label: "疲劳耐受" },
               { key: "sleepQuality", label: "睡眠质量" },
               { key: "heartAttackRisk", label: "心梗风险" }
            );
         }

         // 在图表工作表中添加数据（时间列 + 各数值列）
         const chartHeaders = ["时间", ...numericFields.map((f) => f.label)];
         chartWorksheet.addRow(chartHeaders);

         // 设置表头样式
         const chartHeaderRow = chartWorksheet.getRow(1);
         chartHeaderRow.font = { bold: true };
         chartHeaderRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE6E6FA" },
         };

         // 添加数据行
         historicalData.forEach((item) => {
            const row = [
               item.time || dayjs(item.dateTime).format("HH:mm:ss"),
               ...numericFields.map((field) => {
                  const value = item[field.key];
                  return value !== null && value !== undefined ? Number(value) : "";
               }),
            ];
            chartWorksheet.addRow(row);
         });

         // 自动调整列宽
         chartWorksheet.columns.forEach((column, index) => {
            if (column && column.eachCell) {
               let maxLength = 0;
               column.eachCell({ includeEmpty: true }, (cell) => {
                  const columnLength = cell.value ? cell.value.toString().length : 10;
                  if (columnLength > maxLength) {
                     maxLength = columnLength;
                  }
               });
               column.width = Math.min(maxLength + 2, 20);
            }
         });

         // 添加折线图说明
         // 注意：ExcelJS 4.4.0不直接支持图表功能，但数据已准备好，用户可以在Excel中手动创建图表
         const dataRowCount = historicalData.length;
         if (dataRowCount > 0 && numericFields.length > 0) {
            // 在数据下方添加说明和创建指引
            const tipRow = dataRowCount + 3;

            // 计算最后一列的字母（A=时间列，B开始是数据列）
            const lastColLetter = String.fromCharCode(65 + numericFields.length); // A + 字段数量

            chartWorksheet.getCell(`A${tipRow}`).value = "图表创建指引：";
            chartWorksheet.getCell(`A${tipRow}`).font = { bold: true, size: 12, color: { argb: "FF333333" } };

            chartWorksheet.getCell(`A${tipRow + 1}`).value =
               "1. 选中数据区域（包括表头）：A1 到 " + lastColLetter + (dataRowCount + 1);
            chartWorksheet.getCell(`A${tipRow + 1}`).font = { size: 10, color: { argb: "FF666666" } };

            chartWorksheet.getCell(`A${tipRow + 2}`).value = "2. 点击【插入】选项卡 → 【图表】→ 【折线图】";
            chartWorksheet.getCell(`A${tipRow + 2}`).font = { size: 10, color: { argb: "FF666666" } };

            chartWorksheet.getCell(`A${tipRow + 3}`).value =
               "3. Excel会自动根据数据创建折线图，显示所有数值型数据的趋势";
            chartWorksheet.getCell(`A${tipRow + 3}`).font = { size: 10, color: { argb: "FF666666" } };

            // 尝试使用ExcelJS的图表功能（如果未来版本支持）
            // 注意：当前ExcelJS 4.4.0版本可能不支持图表，但保留代码以便未来升级
            try {
               // 检查是否有图表API（使用类型断言避免TypeScript错误）
               const worksheetAny = chartWorksheet as any;
               if (typeof worksheetAny.addChart === "function") {
                  const chart = worksheetAny.addChart({
                     type: "line",
                     name: "数据趋势图",
                  });

                  // 添加系列
                  numericFields.forEach((field, index) => {
                     chart.addSeries({
                        name: field.label,
                        categories: {
                           sheet: chartWorksheet.name,
                           from: { row: 2, col: 1 },
                           to: { row: dataRowCount + 1, col: 1 },
                        },
                        values: {
                           sheet: chartWorksheet.name,
                           from: { row: 2, col: index + 2 },
                           to: { row: dataRowCount + 1, col: index + 2 },
                        },
                     });
                  });

                  // 设置图表位置和大小
                  if (chart.setPosition) {
                     chart.setPosition(`A${dataRowCount + 5}`, 0);
                  }
                  if (chart.setSize) {
                     chart.setSize({ width: 800, height: 400 });
                  }
               }
            } catch (error) {
               // 图表功能不可用，说明文字已添加，无需额外处理
               console.debug("ExcelJS图表功能不可用，已添加手动创建指引");
            }
         }

         // 生成文件名并下载
         const fileName = `${getSheetName()}_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
         const buffer = await workbook.xlsx.writeBuffer();

         // 创建下载链接
         const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
         const url = window.URL.createObjectURL(blob);
         const link = document.createElement("a");
         link.href = url;
         link.download = fileName;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         window.URL.revokeObjectURL(url);

         message.success("导出成功");
      } catch (error) {
         console.error("导出失败:", error);
         message.error("导出失败，请重试");
      }
   };

   const handlePrint = () => {
      if (historicalData.length === 0) {
         message.warning("没有数据可打印");
         return;
      }

      // 获取列配置
      const columns = getColumns();
      const sheetName = getSheetName();

      // 生成打印HTML
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
         message.error("无法打开打印窗口，请检查浏览器弹窗设置");
         return;
      }

      // 构建表格HTML
      let tableRows = "";
      historicalData.forEach((row, index) => {
         tableRows += "<tr>";
         columns.forEach((col) => {
            const value = row[col.dataIndex as keyof HistoricalData];
            let displayValue = "";
            if (value !== null && value !== undefined) {
               if (typeof value === "number" && col.render) {
                  displayValue = col.render(value, row, index) as string;
               } else {
                  displayValue = String(value);
               }
            }
            tableRows += `<td>${displayValue}</td>`;
         });
         tableRows += "</tr>";
      });

      // 构建表头HTML
      // 辅助函数：从React元素中提取文本
      const extractTextFromElement = (element: any): string => {
         if (typeof element === "string") {
            return element;
         }
         if (typeof element === "number") {
            return String(element);
         }
         if (React.isValidElement(element)) {
            const props = element.props as any;
            // 优先使用children（显示的文本）
            if (props?.children) {
               return extractTextFromElement(props.children);
            }
            // 如果没有children，使用title（提示文本）
            if (props?.title) {
               return extractTextFromElement(props.title);
            }
         }
         return "";
      };

      let tableHeaders = "";
      columns.forEach((col) => {
         let headerText = "";
         if (typeof col.title === "string") {
            headerText = col.title;
         } else if (col.title) {
            headerText = extractTextFromElement(col.title);
         }
         // 如果仍然没有文本，使用dataIndex作为后备
         if (!headerText && col.dataIndex) {
            headerText = String(col.dataIndex);
         }
         tableHeaders += `<th>${headerText}</th>`;
      });

      // 获取查询条件信息
      const filterInfo = [];
      if (filters.personnelId) {
         const personnel = personnelOptions.find((p) => p.value === filters.personnelId);
         filterInfo.push(`人员编号: ${personnel?.label || filters.personnelId}`);
      }
      if (filters.name) {
         const person = nameOptions.find((p) => p.value === filters.name);
         filterInfo.push(`姓名: ${person?.label || filters.name}`);
      }
      if (filters.idNumber) {
         filterInfo.push(`身份证号: ${filters.idNumber}`);
      }
      if (filters.dateRange && filters.dateRange.length === 2) {
         filterInfo.push(
            `时间范围: ${filters.dateRange[0].format("YYYY-MM-DD HH:mm:ss")} 至 ${filters.dateRange[1].format(
               "YYYY-MM-DD HH:mm:ss"
            )}`
         );
      }
      if (filters.sleepDate) {
         filterInfo.push(`日期: ${filters.sleepDate.format("YYYY-MM-DD")}`);
      }

      // 生成完整的HTML文档
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
   <meta charset="UTF-8">
   <title>${sheetName} - 打印</title>
   <style>
      @media print {
         @page {
            size: A4 landscape;
            margin: 1cm;
         }
         body {
            margin: 0;
            padding: 0;
         }
         .no-print {
            display: none;
         }
      }
      * {
         margin: 0;
         padding: 0;
         box-sizing: border-box;
      }
      body {
         font-family: "Microsoft YaHei", "SimSun", "SimHei", "Arial Unicode MS", "Arial", sans-serif;
         font-size: 12px;
         padding: 20px;
         color: #000;
      }
      .print-header {
         text-align: center;
         margin-bottom: 20px;
         border-bottom: 2px solid #000;
         padding-bottom: 10px;
      }
      .print-header h1 {
         font-size: 18px;
         font-weight: bold;
         margin-bottom: 10px;
      }
      .print-info {
         font-size: 11px;
         margin-bottom: 15px;
         line-height: 1.6;
      }
      .print-info span {
         margin-right: 20px;
      }
      table {
         width: 100%;
         border-collapse: collapse;
         margin-top: 10px;
         font-size: 11px;
      }
      th, td {
         border: 1px solid #000;
         padding: 6px 8px;
         text-align: left;
         word-wrap: break-word;
      }
      th {
         background-color: #f0f0f0;
         font-weight: bold;
         text-align: center;
      }
      tr:nth-child(even) {
         background-color: #f9f9f9;
      }
      .print-footer {
         margin-top: 20px;
         text-align: right;
         font-size: 10px;
         color: #666;
      }
   </style>
</head>
<body>
   <div class="print-header">
      <h1>${sheetName}</h1>
   </div>
   <div class="print-info">
      ${filterInfo.length > 0 ? `<div><strong>查询条件：</strong>${filterInfo.join(" | ")}</div>` : ""}
      <div style="margin-top: 5px;"><strong>打印时间：</strong>${dayjs().format(
         "YYYY-MM-DD HH:mm:ss"
      )} | <strong>数据条数：</strong>${historicalData.length}</div>
   </div>
   <table>
      <thead>
         <tr>${tableHeaders}</tr>
      </thead>
      <tbody>
         ${tableRows}
      </tbody>
   </table>
   <div class="print-footer">
      第 1 页 | 共 1 页
   </div>
   <script>
      window.onload = function() {
         window.print();
         window.onafterprint = function() {
            window.close();
         };
      };
   </script>
</body>
</html>`;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
   };

   const getSheetName = () => {
      const names: Record<string, string> = {
         basic: "基础体征数据",
         analysis: "心率分析数据",
         sleep: "睡眠分析数据",
         comprehensive: "综合评测数据",
      };
      return names[dataCategory] || "历史数据";
   };

   // 根据数据类别返回不同的列配置
   const getColumns = () => {
      const baseColumns = [
         { title: "人员编号", dataIndex: "personnelId", key: "personnelId", width: 100 },
         { title: "姓名", dataIndex: "name", key: "name", width: 100 },
         {
            title: "时间",
            dataIndex: "dateTime",
            key: "dateTime",
            width: 180,
         },
      ];

      let dataColumns: any[] = [];

      if (dataCategory === "basic") {
         dataColumns = [
            {
               title: <Tooltip title='次/分钟'>心率</Tooltip>,
               dataIndex: "heartRate",
               key: "heartRate",
               render: (val: number) => val?.toFixed(1),
            },
            {
               title: <Tooltip title='次/分钟'>呼吸率</Tooltip>,
               dataIndex: "breathRate",
               key: "breathRate",
               render: (val: number) => val?.toFixed(1),
            },
            {
               title: "收缩压",
               dataIndex: "systolicPressure",
               key: "systolicPressure",
               render: (val: number) => val?.toFixed(0),
            },
            {
               title: "舒张压",
               dataIndex: "diastolicPressure",
               key: "diastolicPressure",
               render: (val: number) => val?.toFixed(0),
            },
            { title: "血氧(%)", dataIndex: "spo2", key: "spo2", render: (val: number) => val?.toFixed(1) },
            {
               title: "体温(℃)",
               dataIndex: "bodyTemperature",
               key: "bodyTemperature",
               render: (val: number) => val?.toFixed(1),
            },
         ];
      } else if (dataCategory === "analysis") {
         dataColumns = [
            {
               title: <Tooltip title='所有正常R-R间期的标准差，反映整体HRV'>SDNN</Tooltip>,
               dataIndex: "sdnn",
               key: "sdnn",
               render: (val: number) => val?.toFixed(1),
            },
            {
               title: <Tooltip title='相邻R-R间期差值的均方根，反映迷走神经活性'>RMSSD</Tooltip>,
               dataIndex: "rmssd",
               key: "rmssd",
               render: (val: number) => val?.toFixed(1),
            },
            {
               title: <Tooltip title='相邻R-R间期差值超过50毫秒的比例，反映副交感神经活性'>pNN50</Tooltip>,
               dataIndex: "pnn50",
               key: "pnn50",
               render: (val: number) => val?.toFixed(1),
            },
            {
               title: <Tooltip title='低频功率，反映交感神经和副交感神经的平衡'>LF</Tooltip>,
               dataIndex: "lfPower",
               key: "lfPower",
               render: (val: number) => val?.toFixed(0),
            },
            {
               title: <Tooltip title='高频功率，反映迷走神经活性'>HF</Tooltip>,
               dataIndex: "hfPower",
               key: "hfPower",
               render: (val: number) => val?.toFixed(0),
            },
            {
               title: (
                  <Tooltip title='LF/HF比值，反映交感神经和副交感神经的平衡，值越高表示交感神经占优势'>LF/HF</Tooltip>
               ),
               dataIndex: "lfHfRatio",
               key: "lfHfRatio",
               render: (val: number) => val?.toFixed(2),
            },
            {
               title: "呼吸SD",
               dataIndex: "breathRateVariabilitySD",
               key: "breathSD",
               render: (val: number) => val?.toFixed(2),
            },
            {
               title: "呼吸CV",
               dataIndex: "breathAmplitudeVariabilityCV",
               key: "breathCV",
               render: (val: number) => val?.toFixed(2),
            },
         ];
      } else if (dataCategory === "sleep") {
         dataColumns = [
            {
               title: "深睡时长(分)",
               dataIndex: "deepSleepDuration",
               key: "deepSleep",
               render: (val: number) => val?.toFixed(0),
            },
            {
               title: "连续深睡(分)",
               dataIndex: "continuousDeepSleep",
               key: "continuousDeep",
               render: (val: number) => val?.toFixed(0),
            },
            {
               title: "浅睡时长(分)",
               dataIndex: "lightSleepDuration",
               key: "lightSleep",
               render: (val: number) => val?.toFixed(0),
            },
            {
               title: "清醒时长(分)",
               dataIndex: "awakeDuration",
               key: "awake",
               render: (val: number) => val?.toFixed(0),
            },
            {
               title: "睡眠总时长(分)",
               dataIndex: "totalSleepDuration",
               key: "totalSleep",
               render: (val: number) => val?.toFixed(0),
            },
            {
               title: "睡眠质量分数",
               dataIndex: "sleepQuality",
               key: "sleepQuality",
               render: (val: number) => val?.toFixed(0),
            },
         ];
      } else if (dataCategory === "comprehensive") {
         dataColumns = [
            { title: "压力值(%)", dataIndex: "stressEmotion", key: "stress", render: (val: number) => val?.toFixed(0) },
            {
               title: "疲劳耐受(%)",
               dataIndex: "fatigueTolerance",
               key: "fatigue",
               render: (val: number) => val?.toFixed(0),
            },
            {
               title: "睡眠质量",
               dataIndex: "sleepQuality",
               key: "sleepQuality2",
               render: (val: number) => val?.toFixed(0),
            },
            {
               title: "心梗风险(‱)",
               dataIndex: "heartAttackRisk",
               key: "heartAttack",
               render: (val: number) => val?.toFixed(2),
            },
         ];
      }

      return [...baseColumns, ...dataColumns];
   };

   // 统计卡片指标中文名称映射（按数据类别，无中文名时回退到原 key）
   const statisticLabelMap: Record<string, Record<string, string>> = {
      basic: { heartRate: "心率", breathRate: "呼吸率", systolicPressure: "收缩压", diastolicPressure: "舒张压" },
      analysis: { sdnn: "SDNN", rmssd: "RMSSD", pnn50: "pNN50" },
      sleep: {
         totalSleep: "睡眠总时长(分)",
         deepSleep: "深睡时长(分)",
         lightSleep: "浅睡时长(分)",
         sleepQuality: "睡眠质量分数",
      },
      comprehensive: {
         stress: "压力值",
         fatigue: "疲劳耐受",
         sleepQuality: "睡眠质量",
         heartAttack: "心梗风险",
      },
   };

   // 统计数据
   const statistics = useMemo(() => {
      if (historicalData.length === 0) return null;

      const calculateStats = (key: keyof HistoricalData) => {
         const values = historicalData
            .map((item) => item[key] as number)
            .filter((val) => val !== undefined && val !== null);
         if (values.length === 0) return { max: 0, min: 0, avg: 0 };
         return {
            max: Math.max(...values),
            min: Math.min(...values),
            avg: values.reduce((sum, val) => sum + val, 0) / values.length,
         };
      };

      // 根据dataCategory返回不同的统计信息
      if (dataCategory === "basic") {
         return {
            heartRate: calculateStats("heartRate"),
            breathRate: calculateStats("breathRate"),
            systolicPressure: calculateStats("systolicPressure"),
            diastolicPressure: calculateStats("diastolicPressure"),
         };
      } else if (dataCategory === "analysis") {
         return {
            sdnn: calculateStats("sdnn"),
            rmssd: calculateStats("rmssd"),
            pnn50: calculateStats("pnn50"),
         };
      } else if (dataCategory === "sleep") {
         return {
            totalSleep: calculateStats("totalSleepDuration"),
            deepSleep: calculateStats("deepSleepDuration"),
            lightSleep: calculateStats("lightSleepDuration"),
            sleepQuality: calculateStats("sleepQuality"),
         };
      } else if (dataCategory === "comprehensive") {
         return {
            stress: calculateStats("stressEmotion"),
            fatigue: calculateStats("fatigueTolerance"),
            sleepQuality: calculateStats("sleepQuality"),
            heartAttack: calculateStats("heartAttackRisk"),
         };
      }
      return null;
   }, [historicalData, dataCategory]);

   // 数据类别Tabs
   const categoryItems = [
      { key: "basic", label: "基础体征" },
      { key: "analysis", label: "心率分析" },
      { key: "sleep", label: "睡眠分析" },
      { key: "comprehensive", label: "综合评测" },
   ];

   return (
      <div style={{ padding: "24px" }}>
         <h2>历史数据查询</h2>

         {/* 数据类别Tab */}
         <div
            style={{
               background: "#fff",
               borderRadius: "8px",
               boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
               marginBottom: "16px",
            }}
         >
            <Tabs
               activeKey={dataCategory}
               onChange={setDataCategory}
               items={categoryItems}
               style={{
                  margin: 0,
                  padding: "0 16px",
               }}
               tabBarStyle={{
                  marginBottom: 0,
                  borderBottom: "1px solid #f0f0f0",
               }}
            />
         </div>

         {/* 查询表单和数据表格容器 */}
         <div
            style={{
               background: "#fff",
               borderRadius: "8px",
               boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
               padding: "24px",
            }}
         >
            <Form
               layout='vertical'
               onFinish={handleSearch}
               form={form}
               onValuesChange={(changedValues, allValues) => {
                  if (changedValues.personnelId !== undefined) {
                     allValues.name = null;
                     allValues.idNumber = "";
                  }
                  if (changedValues.name !== undefined) {
                     allValues.personnelId = null;
                     allValues.idNumber = "";
                  }
                  if (changedValues.idNumber !== undefined) {
                     allValues.personnelId = null;
                     allValues.name = null;
                  }
                  setFilters(allValues);
               }}
            >
               <Row gutter={16}>
                  <Col span={4}>
                     <Form.Item label='人员编号' name='personnelId'>
                        <Select
                           showSearch
                           placeholder='请选择人员编号'
                           optionFilterProp='children'
                           filterOption={(input, option) =>
                              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                           }
                           options={personnelOptions}
                           allowClear
                           disabled={!!filters.name || !!filters.idNumber}
                        />
                     </Form.Item>
                  </Col>
                  <Col span={5}>
                     <Form.Item label='姓名' name='name'>
                        <Select
                           showSearch
                           placeholder='请选择姓名'
                           optionFilterProp='children'
                           filterOption={(input, option) =>
                              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                           }
                           options={nameOptions}
                           allowClear
                           disabled={!!filters.personnelId || !!filters.idNumber}
                        />
                     </Form.Item>
                  </Col>
                  <Col span={5}>
                     <Form.Item label='身份证号' name='idNumber'>
                        <Select
                           showSearch
                           placeholder='请选择身份证号'
                           optionFilterProp='children'
                           filterOption={(input, option) =>
                              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                           }
                           options={idNumberOptions}
                           allowClear
                           disabled={!!filters.personnelId || !!filters.name}
                        />
                     </Form.Item>
                  </Col>
                  <Col span={10}>
                     {dataCategory === "sleep" ? (
                        <Form.Item label='日期' name='sleepDate'>
                           <DatePicker
                              onChange={(date) => {
                                 setFilters((prev) => ({ ...prev, sleepDate: date || null }));
                              }}
                           />
                        </Form.Item>
                     ) : (
                        <Form.Item label='时间范围' name='dateRange'>
                           <RangePicker showTime />
                        </Form.Item>
                     )}
                  </Col>
               </Row>
               <Form.Item style={{ textAlign: "right" }}>
                  <Space>
                     <Button type='primary' htmlType='submit' icon={<SearchOutlined />} loading={loading}>
                        查询
                     </Button>
                     <Button onClick={handleReset} icon={<ReloadOutlined />}>
                        重置
                     </Button>
                     <Button onClick={handleExport} icon={<DownloadOutlined />} disabled={historicalData.length === 0}>
                        导出Excel
                     </Button>
                     <Button onClick={handlePrint} icon={<PrinterOutlined />} disabled={historicalData.length === 0}>
                        打印
                     </Button>
                  </Space>
               </Form.Item>
            </Form>

            {/* 统计信息卡片 */}
            {statistics && historicalData.length > 0 && (
               <Row gutter={16} style={{ marginBottom: "16px" }}>
                  {Object.entries(statistics).map(([key, value]: [string, any]) => {
                     // 第一行：指标名称（有中文展示中文，否则回退到原 key）
                     const label = statisticLabelMap[dataCategory]?.[key] ?? key;
                     return (
                        <Col span={6} key={key}>
                           <div
                              style={{
                                 height: "68px",
                                 padding: "8px 12px",
                                 border: "1px solid #f0f0f0",
                                 borderRadius: "8px",
                                 background: "#fff",
                                 display: "flex",
                                 flexDirection: "column",
                                 justifyContent: "space-between",
                              }}
                           >
                              {/* 第一行：指标名称 */}
                              <div style={{ fontSize: "13px", color: "#8c8c8c", lineHeight: 1.2 }}>{label}</div>
                              {/* 第二行：平均值 */}
                              <div style={{ fontSize: "20px", fontWeight: 600, lineHeight: 1.2 }}>
                                 {value.avg.toFixed(2)}
                              </div>
                              {/* 第三行：Max（暗红）/ Min（暗绿） */}
                              <div style={{ fontSize: "12px", lineHeight: 1.2 }}>
                                 <span style={{ color: "#a8071a" }}>Max: {value.max.toFixed(1)}</span>
                                 <span style={{ color: "#bfbfbf", margin: "0 6px" }}>/</span>
                                 <span style={{ color: "#389e0d" }}>Min: {value.min.toFixed(1)}</span>
                              </div>
                           </div>
                        </Col>
                     );
                  })}
               </Row>
            )}

            {/* 数据表格 */}
            <Table
               dataSource={historicalData}
               columns={getColumns()}
               rowKey={(record) => `${record.personnelId}-${record.dateTime}`}
               loading={loading}
               scroll={{ x: 1200 }}
               pagination={{
                  pageSize: 50,
                  showSizeChanger: true,
                  showTotal: (total) => `共 ${total} 条数据`,
               }}
            />
         </div>
      </div>
   );
};

export default HistoryData;
