import { Navigate, Outlet } from "react-router-dom";

export default function GuestRoute() {
  const token = localStorage.getItem("ic_token");
  const role = localStorage.getItem("ic_role");
  if (token) return <Navigate to={role === "student" ? "/student" : "/company"} replace />;
  return <Outlet />;
}
