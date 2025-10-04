// frontend/src/pages/CompanyDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Bell, Home, Briefcase, Users, BarChart3, Plus, UserCog, Settings, LogOut, PanelLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0]?.toUpperCase() || "")
    .slice(0, 2)
    .join("");
}

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
  const fullName = `${person.firstName} ${person.lastName}`.trim();

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
          logout(navigate);
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

  const asideWidth = collapsed ? "w-16" : "w-64";

  return (
    <div className="min-h-screen bg-[#ECF3FC] flex">
      {/* LEFT SIDEBAR */}
      <aside
        className={`${asideWidth} bg-[#173B8A] text-white hidden md:flex flex-col transition-[width] duration-200`}
      >
        <div
          className={`h-16 w-full px-6 border-b border-white/15 flex items-center gap-3 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {/* perfect square logo, centered */}
          <div className="bg-[#F37526] rounded-md w-7 h-7 aspect-square grid place-items-center" />
          {!collapsed && <div className="font-bold">InternConnect</div>}
        </div>

        <div className={`p-4 text-xs uppercase tracking-wide text-white/70 ${collapsed ? "hidden" : "block"}`}>
          Navigation
        </div>
        <nav className="px-2 flex flex-col gap-1 mt-2">
          <NavItem icon={<Home className="w-4 h-4" />} label="Dashboard" active collapsed={collapsed} />
          <NavItem icon={<Briefcase className="w-4 h-4" />} label="Job Postings" collapsed={collapsed} />
          <NavItem icon={<Users className="w-4 h-4" />} label="Applications" collapsed={collapsed} />
          <NavItem icon={<BarChart3 className="w-4 h-4" />} label="Analytics" collapsed={collapsed} />
        </nav>

        <div className={`p-4 text-xs uppercase tracking-wide text-white/70 mt-4 ${collapsed ? "hidden" : "block"}`}>
          Quick Actions
        </div>
        <nav className="px-2 flex flex-col gap-1">
          <NavItem icon={<Plus className="w-4 h-4" />} label="Post New Job" collapsed={collapsed} />
        </nav>

        <div className={`p-4 text-xs uppercase tracking-wide text-white/70 mt-4 ${collapsed ? "hidden" : "block"}`}>
          Organization
        </div>
        <nav className="px-2 flex flex-col gap-1">
          <NavItem icon={<UserCog className="w-4 h-4" />} label="Employees" collapsed={collapsed} />
          <NavItem icon={<Settings className="w-4 h-4" />} label="Setting" collapsed={collapsed} />
        </nav>

        <div className="mt-auto p-2">
          <button
            onClick={() => logout(navigate)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 transition"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-[#173B8A] text-white flex items-center justify-between px-4 md:px-6 ml-1 md:ml-1">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleCollapsed}
              className="w-8 h-8 rounded border border-white/30 grid place-items-center hover:bg-white/10 transition"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label="Toggle sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <div className="text-xl font-semibold">{companyName}</div>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative hover:opacity-90" title="Notifications">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-white/80 text-[#173B8A] font-semibold grid place-items-center">
                {getInitials(fullName || companyName)}
              </div>
              <div className="leading-tight text-right">
                <div className="font-medium">{fullName || "User"}</div>
                <div className="text-xs text-white/80">{person.role || "Member"}</div>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="p-6">
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : (
            <div className="text-gray-700">
              {/* Put dashboard widgets here */}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, collapsed }) {
  return (
    <button
      className={[
        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition",
        collapsed ? "justify-center" : "",
        active
          ? "bg-white/10 text-white shadow-inner"
          : "text-white/90 hover:bg-white/10 hover:text-white",
      ].join(" ")}
      title={label}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}

function logout(navigate) {
  localStorage.removeItem("ic_token");
  localStorage.removeItem("ic_role");
  localStorage.removeItem("ic_profile");
  navigate("/login", { replace: true });
}
