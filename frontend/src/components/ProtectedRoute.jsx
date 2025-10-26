import { Navigate, Outlet } from "react-router-dom";


export default function ProtectedRoute({ allow = ["student", "company"] }) {
  const studentToken = localStorage.getItem("ic_token");           // student
  const companyToken = localStorage.getItem("ic_company_token");    // company
  const storedRole = localStorage.getItem("ic_role");

  // Infer role if not stored
  const role =
    storedRole ||
    (companyToken ? "company" : studentToken ? "student" : "");

  // Not logged in?
  if (!studentToken && !companyToken) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role for this route → push to their home
  if (!allow.includes(role)) {
    return <Navigate to={role === "company" ? "/company" : "/student"} replace />;
  }

  return <Outlet />;
}
