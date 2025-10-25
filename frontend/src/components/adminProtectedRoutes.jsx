import React from "react";
import { Navigate } from "react-router-dom";
import { isLoggedIn } from "@/utils/adminAuth";

export default function ProtectedAdminRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/admin/login" replace />;
}
