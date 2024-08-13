import React, { useState } from "react";
import { Tabs } from "antd";
import AlarmForm from "../AlarmSettings/AlarmForm";
import SmsForm from "../AlarmSettings/SmsForm";
import MiniProgramForm from "../AlarmSettings/MiniProgramForm";
import { defaultSmsConfig, defaultMiniConfig } from "../../types";

const AlarmSettings: React.FC = () => {
   const [activeTabKey, setActiveTabKey] = useState("1");

   const handleTabChange = (key: string) => {
      setActiveTabKey(key);
   };

   const items = [
      {
         key: "1",
         label: `报警设置`,
         children: <AlarmForm />,
      },
      {
         key: "2",
         label: "短信设置",
         children: <SmsForm initialValues={defaultSmsConfig} />,
      },
      {
         key: "3",
         label: "小程序设置",
         children: <MiniProgramForm initialValues={defaultMiniConfig} />,
      },
   ];

   return (
      <div style={{ marginLeft: "5%", marginRight: "5%" }}>
         <h2>报警设置</h2>
         <Tabs activeKey={activeTabKey} onChange={handleTabChange} items={items} />
      </div>
   );
};

export default AlarmSettings;
