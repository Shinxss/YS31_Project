// src/pages/company/CompanyDashboard.jsx (example usage)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import { clearAuth, getUser } from "@/utils/auth"; // if you have these

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const user = getUser(); // { name, role, companyName }

  const handleLogout = () => {
    clearAuth?.();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col">
        <Header
          companyName={user?.companyName || "Shinxss"}
          userName={user?.name || "Jachin Adam Aliman"}
          userRole={user?.role || "Owner"}
          onToggleSidebar={() => setOpen(o => !o)}
        />
        {/* content */}
      </div>
    </div>
  );
}
