import React, { useState } from "react";
import { Select, Space } from "antd";

const { Option } = Select;

interface TimeRangePickerProps {
   value?: [string, string]; // Array of two time strings (HH:mm)
   onChange?: (value: [string, string]) => void;
}

const TimeRangePicker: React.FC<TimeRangePickerProps> = ({ value, onChange }) => {
   const [startTime, setStartTime] = useState<string>(value?.[0] || "00:00");
   const [endTime, setEndTime] = useState<string>(value?.[1] || "00:00");

   const handleStartTimeChange = (newStartTime: string) => {
      setStartTime(newStartTime);
      onChange?.([newStartTime, endTime]);
   };

   const handleEndTimeChange = (newEndTime: string) => {
      setEndTime(newEndTime);
      onChange?.([startTime, newEndTime]);
   };

   const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
   const minutes = ["00", "15", "30", "45"];

   return (
      <Space>
         <Select value={startTime.split(":")[0]} onChange={handleStartTimeChange} style={{ width: 60 }}>
            {hours.map((hour) => (
               <Option key={hour} value={hour}>
                  {hour}
               </Option>
            ))}
         </Select>
         <span>:</span>
         <Select
            value={startTime.split(":")[1]}
            onChange={(newMinutes) => handleStartTimeChange(`${startTime.split(":")[0]}:${newMinutes}`)}
            style={{ width: 80 }}
         >
            {minutes.map((minute) => (
               <Option key={minute} value={minute}>
                  {minute}
               </Option>
            ))}
         </Select>
         <span>~</span>
         <Select value={endTime.split(":")[0]} onChange={handleEndTimeChange} style={{ width: 60 }}>
            {hours.map((hour) => (
               <Option key={hour} value={hour}>
                  {hour}
               </Option>
            ))}
         </Select>
         <span>:</span>
         <Select
            value={endTime.split(":")[1]}
            onChange={(newMinutes) => handleEndTimeChange(`${endTime.split(":")[0]}:${newMinutes}`)}
            style={{ width: 80 }}
         >
            {minutes.map((minute) => (
               <Option key={minute} value={minute}>
                  {minute}
               </Option>
            ))}
         </Select>
      </Space>
   );
};

export default TimeRangePicker;
