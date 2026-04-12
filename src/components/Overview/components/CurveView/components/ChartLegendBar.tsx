import React from "react";
import { SeriesConfig } from "../../../../../shared";

interface ChartLegendBarProps {
   seriesConfigs: SeriesConfig[];
   legendVisible: Record<string, boolean>;
   onToggle: (seriesName: string) => void;
}

/**
 * 图例控制条：颜色图标 + 文本；根据分组动态生成；单选控制所有小卡片
 */
const ChartLegendBar: React.FC<ChartLegendBarProps> = ({ seriesConfigs, legendVisible, onToggle }) => {
   return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
         {seriesConfigs.map((cfg) => (
            <button
               key={cfg.name}
               onClick={() => onToggle(cfg.name)}
               style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  border: legendVisible[cfg.name] ? "1px solid " + cfg.color : "1px solid #d9d9d9",
                  background: legendVisible[cfg.name] ? "#ffffff" : "#fafafa",
                  borderRadius: 14,
                  padding: "2px 8px",
                  height: 24,
                  cursor: "pointer",
               }}
            >
               <span
                  style={{
                     width: 10,
                     height: 10,
                     borderRadius: 10,
                     background: cfg.color,
                     display: "inline-block",
                  }}
               />
               <span style={{ fontSize: 12, color: "#555" }}>{cfg.name}</span>
            </button>
         ))}
      </div>
   );
};

export default ChartLegendBar;
