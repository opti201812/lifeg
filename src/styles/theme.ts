import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: 'Roboto', sans-serif;
  }
  @keyframes blink {
    0% { background-color: #ffcccc; }
    50% { background-color: #ff9999; }
    100% { background-color: #ffcccc; }
  }
`;

export const theme = {
   primaryColor: "#1890ff",
   secondaryColor: "#ff4d4f",
   headerBackgroundColor: "#001529",
   contentBackgroundColor: "rgba(243, 243, 243, 1)",
   menuBackgroundColor: "#002140",
   alarmBannerBackgroundColor: "#ffffff",
   //  alarmBannerBackgroundColor: "#ffe58f",
};

export const settingSpace = {
   marginLeft: "3%",
   marginRight: "3%",
};
