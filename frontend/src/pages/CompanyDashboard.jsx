// src/pages/CompanyDashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

const CompanyDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("ic_token");
    localStorage.removeItem("ic_role");
    localStorage.removeItem("ic_profile");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#ECF3FC]">
      <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-blue-900">
          🏢 Company Dashboard
        </h1>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#F37526] text-white hover:bg-[#e56818] transition"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-16">
        <p className="text-gray-700">
          Welcome! Put your company widgets/content here.
        </p>
      </div>
    </div>
  );
};

export default CompanyDashboard;
