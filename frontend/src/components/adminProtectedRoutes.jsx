// src/components/adminProtectedRoutes.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../utils/adminAuth";

export default function ProtectedAdminRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
