import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "../components/dashboard/HeaderBar.jsx";
import Sidebar from "../components/dashboard/Sidebar.jsx";
import PostJobModal from "../components/dashboard/PostJobModal.jsx";
import JobList from "../components/dashboard/JobList.jsx";

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
  const [openPost, setOpenPost] = useState(false);
  const [active, setActive] = useState("Dashboard");

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
    <div className="min-h-screen bg-[#ECF3FC] flex">
      <Sidebar
        collapsed={collapsed}
        onPostJob={() => setOpenPost(true)}
        onLogout={() => doLogout(navigate)}
        onNav={setActive}
        active={active}
      />

      <div className="flex-1 flex flex-col">
        <HeaderBar
          companyName={companyName}
          person={person}
          onToggleSidebar={toggleCollapsed}
        />

        <main className="p-6">
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : (
            <>
              {active === "Dashboard" && (
                <div className="text-gray-700">Welcome back, {person.firstName || "User"}.</div>
              )}

              {active === "Job Postings" && (
                <JobList token={token} />
              )}

              {/* placeholders for future tabs */}
              {active === "Applications" && (
                <div className="text-gray-600">Applications view coming soon…</div>
              )}
              {active === "Analytics" && (
                <div className="text-gray-600">Analytics view coming soon…</div>
              )}
            </>
          )}
        </main>
      </div>

      <PostJobModal
        open={openPost}
        onClose={() => setOpenPost(false)}
        token={token}
        onCreated={() => {
          // after creating, jump to Job Postings and allow JobList to refetch itself if desired
          setActive("Job Postings");
        }}
      />
    </div>
  );
}

function doLogout(navigate) {
  localStorage.removeItem("ic_token");
  localStorage.removeItem("ic_role");
  localStorage.removeItem("ic_profile");
  navigate("/", { replace: true });
}
