import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store";
import App from "./App";
import { GlobalStyle } from "./styles/theme";

ReactDOM.render(
   <Provider store={store}>
      <Router>
         <GlobalStyle />
         <Routes>
            <Route path='/*' element={<App />} />
         </Routes>
      </Router>
   </Provider>,
   document.getElementById("root")
);
