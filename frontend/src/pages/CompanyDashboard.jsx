import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "../components/dashboard/HeaderBar.jsx";
import Sidebar from "../components/dashboard/Sidebar.jsx";
import PostJobModal from "@/components/dashboard/PostJobModal.jsx";
import JobList from "@/components/dashboard/JobList.jsx";
import PillTabs from "@/components/dashboard/PillTabs.jsx";

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

  const tabDefs = useMemo(
    () => [
      { key: "Dashboard", label: "Overview" },
      { key: "Job Postings", label: "Job Postings" },
      { key: "Applications", label: "Applications" },
    ],
    []
  );
  const activeIndex = Math.max(0, tabDefs.findIndex((t) => t.key === active));

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
              {/* centered welcome */}
              <div className="mb-4 max-w-5xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Welcome back{person.firstName ? `, ${person.firstName}!` : "!"}
                </h2>
                <p className="text-gray-500 mt-1">
                  Manage your internship program and track recruitment progress
                </p>
              </div>

              {/* centered pill tabs */}
              <div className="max-w-5xl mx-auto mb-6">
                <PillTabs
                  tabs={tabDefs}
                  active={activeIndex}
                  onChange={(idx) => setActive(tabDefs[idx].key)}
                />
              </div>

              {/* centered panels */}
              <div className="max-w-5xl mx-auto">
                {active === "Dashboard" && (
                  <section className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="text-lg font-semibold mb-2">Overview</h3>
                    <p className="text-gray-600">
                      High-level stats and recent activity will be shown here.
                    </p>
                  </section>
                )}

                {active === "Job Postings" && (
                  <section className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Job Postings</h3>
                      <button
                        onClick={() => setOpenPost(true)}
                        className="px-3 py-2 rounded-md bg-[#F37526] text-white hover:bg-orange-600"
                      >
                        Post New Job
                      </button>
                    </div>
                    <JobList token={token} />
                  </section>
                )}

                {active === "Applications" && (
                  <section className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="text-lg font-semibold mb-2">Applications</h3>
                    <p className="text-gray-600">Applications view coming soon…</p>
                  </section>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      <PostJobModal
        open={openPost}
        onClose={() => setOpenPost(false)}
        token={token}
        onCreated={() => setActive("Job Postings")}
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
