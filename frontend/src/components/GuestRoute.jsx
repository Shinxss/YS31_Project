import { Navigate, Outlet } from "react-router-dom";

export default function GuestRoute() {
  const studentToken = localStorage.getItem("ic_token");
  const companyToken = localStorage.getItem("ic_company_token");
  const storedRole = localStorage.getItem("ic_role");

  if (studentToken || companyToken) {
    const role =
      storedRole || (companyToken ? "company" : studentToken ? "student" : "");
    return <Navigate to={role === "company" ? "/company" : "/student"} replace />;
  }

  return <Outlet />;
}
