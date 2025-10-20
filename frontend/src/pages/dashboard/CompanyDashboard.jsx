import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import HeaderBar from "../../components/dashboard/HeaderBar.jsx";
import Sidebar from "../../components/dashboard/Sidebar.jsx";

// Pages
import DashboardHome from "./DashboardHome.jsx";
import JobPostingsPage from "./JobPostingsPage.jsx";
import ApplicationsPage from "./ApplicationsPage.jsx";
import AnalyticsPage from "./AnalyticsPage.jsx";
import PostJobPage from "./PostJobPage.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function CompanyDashboard() {
  const navigate = useNavigate();

  const { token, role } = useMemo(
    () => ({
      token: localStorage.getItem("ic_token"),
      role: localStorage.getItem("ic_role"),
    }),
    []
  );

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("ic_company_sidebar");
    return saved === "1";
  });
  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem("ic_company_sidebar", next ? "1" : "0");
      return next;
    });
  };

  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("Company");
  const [person, setPerson] = useState({ firstName: "", lastName: "", role: "" });

  useEffect(() => {
    if (!token || role !== "company") {
      navigate("/login", { replace: true });
    }
  }, [token, role, navigate]);

  useEffect(() => {
    if (!token || role !== "company") return;
    let ignore = false;
    const ctrl = new AbortController();

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/company/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ctrl.signal,
        });

        if (res.status === 401 || res.status === 403) {
          doLogout(navigate);
          return;
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load company");

        if (!ignore) {
          setCompanyName(data.companyName || "Company");
          setPerson({
            firstName: data.user?.firstName || "",
            lastName: data.user?.lastName || "",
            role: data.user?.role || "",
          });
        }
      } catch (e) {
        if (!ignore && e.name !== "AbortError") {
          console.error("Load /company/me failed:", e);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
      ctrl.abort();
    };
  }, [token, role, navigate]);

  return (
    <div className="h-screen bg-[#ECF3FC] flex overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        onLogout={() => doLogout(navigate)}
        onToggleSidebar={toggleCollapsed}
      />

      {/* Right panel: column with non-scrolling header + scrolling content */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="shrink-0">
          <HeaderBar
            companyName={companyName}
            person={person}
            onToggleSidebar={toggleCollapsed}
          />
        </div>

        {/* Only this main area scrolls */}
        <main className="flex-1 min-h-0 overflow-y-auto p-6">
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : (
            <Routes>
              {/* All subpages inside dashboard */}
              <Route path="/" element={<DashboardHome />} />
              <Route path="postings" element={<JobPostingsPage token={token} />} />
              <Route path="applications" element={<ApplicationsPage token={token} />} />
              <Route path="analytics" element={<AnalyticsPage token={token} />} />
              <Route path="post-job" element={<PostJobPage token={token} />} />
            </Routes>
          )}
        </main>
      </div>
    </div>
  );
}

function doLogout(navigate) {
  localStorage.removeItem("ic_token");
  localStorage.removeItem("ic_role");
  localStorage.removeItem("ic_profile");
  navigate("/", { replace: true });
}
