import React from "react";
import { Bell } from "lucide-react";
import { useLocation } from "react-router-dom";

const routeTitles = {
  "/dashboard": "Dashboard",
  "/usermanagement": "User Management",
  "/companyapplications": "Company Applications",
  "/joblisting": "Job Listing Review",
  "/dataexport": "Data Export",
  "/settings": "Settings",
};

export default function Topbar() {
  const loc = useLocation();
  const title = routeTitles[loc.pathname] || "Admin Dashboard";

  return (
    <header className="fixed top-0 left-72 right-0 h-20 bg-[#16357f] text-white flex items-center justify-between px-10 shadow-md z-20">
      {/* Title */}
      <h1 className="text-3xl font-semibold tracking-wide">{title}</h1>

      {/* Right side - notifications + avatar */}
      <div className="flex items-center gap-6">
        <button aria-label="notifications" className="hover:text-orange-300 transition">
          <Bell size={26} />
        </button>

        <div className="bg-orange-500 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold">
          A
        </div>
      </div>
    </header>
  );
}
