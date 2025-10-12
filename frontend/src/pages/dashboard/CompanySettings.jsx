// src/pages/dashboard/CompanySettings.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

import HeaderBar from "../../components/dashboard/HeaderBar.jsx";
import Sidebar from "../../components/dashboard/Sidebar.jsx";

// Settings sub-pages (company)
import PasswordAndSecurity from "./settings/PasswordAndSecurity.jsx";
import CompanyDetails from "./settings/CompanyDetails.jsx";
import ProfileDetails from "./settings/ProfileDetails.jsx";

// 🔁 moved to components/
import TermsOfService from "@/components/TermsOfService.jsx";
import PrivacyPolicy from "@/components/PrivacyPolicy.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function CompanySettings() {
  const navigate = useNavigate();
  const location = useLocation();

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
    if (!token || role !== "company") navigate("/login", { replace: true });
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
        if (!ignore && e.name !== "AbortError") console.error("Load /company/me failed:", e);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
      ctrl.abort();
    };
  }, [token, role, navigate]);

  const headerTitle = (() => {
    const p = location.pathname;
    if (p.startsWith("/company/settings/password")) return "Password & Security";
    if (p.startsWith("/company/settings/company")) return "Company Details";
    if (p.startsWith("/company/settings/profile")) return "Profile Details";
    if (p.startsWith("/company/settings/terms")) return "Terms of Service";
    if (p.startsWith("/company/settings/privacy")) return "Privacy Policy";
    return "Settings";
  })();

  return (
    <div className="min-h-screen bg-[#ECF3FC] flex">
      <Sidebar collapsed={collapsed} onLogout={() => doLogout(navigate)} />

      <div className="flex-1 flex flex-col">
        <HeaderBar
          companyName={companyName}
          person={person}
          onToggleSidebar={() => {
            const next = !collapsed;
            setCollapsed(next);
            localStorage.setItem("ic_company_sidebar", next ? "1" : "0");
          }}
          title={headerTitle}
        />

        <main className="p-6">
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : (
            <Routes>
              <Route path="/" element={<PasswordAndSecurity />} />
              <Route path="password" element={<PasswordAndSecurity />} />
              <Route path="company" element={<CompanyDetails />} />
              <Route path="profile" element={<ProfileDetails />} />
              <Route path="terms" element={<TermsOfService />} />
              <Route path="privacy" element={<PrivacyPolicy />} />
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
