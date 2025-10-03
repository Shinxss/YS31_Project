import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allow = ["student", "company"] }) {
  const token = localStorage.getItem("ic_token");
  const role = localStorage.getItem("ic_role");
  if (!token) return <Navigate to="/login" replace />;
  if (!allow.includes(role)) return <Navigate to="/" replace />;
  return <Outlet />;
}