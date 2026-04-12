// App.tsx
import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import { Provider } from "react-redux";
import store from "./store";
import { loadConfig } from "./config";

const App: React.FC = () => {
   useEffect(() => {
      loadConfig();
   }, []);

   return (
      <div className='App'>
         <Routes>
            <Route path='/' element={<Navigate to='/login' />} />
            <Route path='/login' element={<Login />} />
            <Route
               path='/dashboard/*'
               element={
                  <ProtectedRoute>
                     <MainLayout />
                  </ProtectedRoute>
               }
            />
            <Route path='*' element={<Navigate to='/login' />} />
         </Routes>
      </div>
   );
};

export default React.memo(App);
