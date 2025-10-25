// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

/* Layout */
import Header from "@/components/admin/Header.jsx";
import AdminSidebar from "@/components/admin/Sidebar.jsx";

/* Auth helpers */
import { getAdmin, clearAdminAuth } from "@/utils/adminAuth.js";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { admin } = useMemo(() => ({ admin: getAdmin() }), []);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("ic_admin_sidebar") === "1"
  );

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem("ic_admin_sidebar", next ? "1" : "0");
      return next;
    });
  };

  useEffect(() => {
    if (!admin) navigate("/admin/login", { replace: true });
  }, [admin, navigate]);

  const handleLogout = () => {
    clearAdminAuth?.();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="h-screen bg-[#ECF3FC] flex overflow-hidden">
      <AdminSidebar collapsed={collapsed} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-h-0">
        <div className="shrink-0">
          <Header
            userName={admin?.name || "System Admin"}
            userRole={admin?.role || "Administrator"}
            onToggleSidebar={toggleCollapsed}
          />
        </div>

        {/* ✅ Render nested admin routes from App.jsx here */}
        <main className="flex-1 min-h-0 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
