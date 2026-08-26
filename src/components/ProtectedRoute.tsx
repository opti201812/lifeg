import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store";

interface ProtectedRouteProps {
   children: React.ReactNode;
   /** 允许访问的角色，缺省时所有已登录角色均可访问 */
   allowedRoles?: ("user" | "admin")[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
   const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
   const role = useSelector((state: RootState) => state.user.role);

   if (!isAuthenticated) {
      return <Navigate to='/login' replace />;
   }

   // user 角色只能访问被明确允许的页面，其余一律重定向回人员总览
   if (allowedRoles && !allowedRoles.includes(role)) {
      return <Navigate to='/dashboard/overview' replace />;
   }

   return <>{children}</>;
};

export default ProtectedRoute;
