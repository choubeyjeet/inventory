import React from "react";
import { Navigate, Outlet } from "react-router-dom";

// ✅ Check token validity (basic)
const isAuthenticated = () => {
  const token = localStorage.getItem("access_token");
  return !!token;
};

export default function ProtectedRoute() {
  if (!isAuthenticated()) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
