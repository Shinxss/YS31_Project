import React from "react";
import {
  Home,
  Users,
  Briefcase,
  ClipboardList,
  Download,
  Settings,
  LogOut,
} from "lucide-react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="w-72 h-screen bg-[#16357f] text-white flex flex-col justify-between fixed left-0 top-0">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-[#12315a]">
          <div className="bg-orange-500 w-12 h-12 rounded-md shadow-md" />
          <span className="text-3xl font-extrabold tracking-tight">
            InternConnect
          </span>
        </div>

        {/* Navigation label */}
        <div className="px-6 mt-8 text-sm text-blue-200 uppercase tracking-widest font-semibold">
          Navigation
        </div>

        {/* Links */}
        <nav className="mt-4 px-3 space-y-3">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-4 px-5 py-4 rounded-lg text-[20px] font-semibold transition-all ${
                isActive ? "bg-white text-[#16357f]" : "hover:bg-[#1052a0]"
              }`
            }
          >
            <Home size={24} /> Dashboard
          </NavLink>

          <NavLink
            to="/usermanagement"
            className={({ isActive }) =>
              `flex items-center gap-4 px-5 py-4 rounded-lg text-[20px] font-semibold transition-all ${
                isActive ? "bg-white text-[#16357f]" : "hover:bg-[#1052a0]"
              }`
            }
          >
            <Users size={24} /> User Management
          </NavLink>

          <NavLink
            to="/companyapplications"
            className={({ isActive }) =>
              `flex items-center gap-4 px-5 py-4 rounded-lg text-[20px] font-semibold transition-all ${
                isActive ? "bg-white text-[#16357f]" : "hover:bg-[#1052a0]"
              }`
            }
          >
            <Briefcase size={24} /> Company Applications
          </NavLink>

          <NavLink
            to="/joblisting"
            className={({ isActive }) =>
              `flex items-center gap-4 px-5 py-4 rounded-lg text-[20px] font-semibold transition-all ${
                isActive ? "bg-white text-[#16357f]" : "hover:bg-[#1052a0]"
              }`
            }
          >
            <ClipboardList size={24} /> Job Listing Review
          </NavLink>

          <NavLink
            to="/dataexport"
            className={({ isActive }) =>
              `flex items-center gap-4 px-5 py-4 rounded-lg text-[20px] font-semibold transition-all ${
                isActive ? "bg-white text-[#16357f]" : "hover:bg-[#1052a0]"
              }`
            }
          >
            <Download size={24} /> Data Export
          </NavLink>
        </nav>

        {/* Settings header */}
        <div className="px-6 mt-10 text-sm text-blue-200 uppercase tracking-widest font-semibold">
          Settings
        </div>

        <nav className="mt-3 px-3 space-y-3">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-4 px-5 py-4 rounded-lg text-[20px] font-semibold transition-all ${
                isActive ? "bg-white text-[#16357f]" : "hover:bg-[#1052a0]"
              }`
            }
          >
            <Settings size={24} /> Settings
          </NavLink>
        </nav>
      </div>

      {/* Logout */}
      <div className="px-6 pb-6 pt-5 border-t border-[#12315a]">
        <button className="w-full flex items-center justify-center gap-3 bg-[#1b54b3] hover:bg-[#184aa3] text-white py-3 rounded-lg text-[20px] font-semibold">
          <LogOut size={22} /> Logout
        </button>
      </div>
    </aside>
  );
}
