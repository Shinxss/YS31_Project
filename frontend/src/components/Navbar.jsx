// src/components/Navbar.jsx
import React, { useMemo } from "react";
import { Briefcase, User, Building2, LogOut, LayoutDashboard } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Hide the marketing header on auth pages & dashboards
  const hideOnThese = useMemo(
    () => [/^\/login/i, /^\/signup/i, /^\/company(?:\/|$)/i, /^\/student(?:\/|$)/i],
    []
  );
  if (hideOnThese.some((re) => re.test(pathname))) return null;

  // Read auth state (what we stored at login)
  const token = localStorage.getItem("ic_token");
  const role = localStorage.getItem("ic_role"); // "student" | "company"
  const isAuthed = Boolean(token && role);

  const goDashboardPath = role === "company" ? "/company" : "/student";

  const onLogout = () => {
    localStorage.removeItem("ic_token");
    localStorage.removeItem("ic_role");
    localStorage.removeItem("ic_profile");
    navigate("/login", { replace: true });
  };

  return (
    <header className="bg-[#173B8A] text-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#F37526] flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
        </Link>

        {/* MOBILE: primary action */}
        {!isAuthed ? (
          <Link
            to="/signup"
            className="md:hidden inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#F37526] hover:bg-[#e56818] transition text-sm font-medium"
          >
            Get Started
          </Link>
        ) : (
          <Link
            to={goDashboardPath}
            className="md:hidden inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white text-[#173B8A] hover:bg-[#F5F7FF] transition text-sm font-medium"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
        )}

        {/* DESKTOP/TABLET NAV */}
        <div className="hidden md:flex items-center gap-10">
          <nav className="flex items-center gap-10 text-sm">
            <Link to="/internships" className="hover:text-[#F5A66E] transition">
              Find Internships
            </Link>
            <Link to="/companies" className="hover:text-[#F5A66E] transition">
              For Companies
            </Link>
            <Link to="/about" className="hover:text-[#F5A66E] transition">
              About Us
            </Link>
          </nav>

          {!isAuthed ? (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 border border-white/30 rounded-md hover:bg-white hover:text-[#173B8A] transition text-sm inline-flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Student Login
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 border border-white/30 rounded-md hover:bg-white hover:text-[#173B8A] transition text-sm inline-flex items-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                Employer Login
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-md bg-[#F37526] hover:bg-[#e56818] transition text-sm font-medium"
              >
                Get Started
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to={goDashboardPath}
                className="px-4 py-2 border border-white/30 rounded-md hover:bg-white hover:text-[#173B8A] transition text-sm inline-flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <button
                onClick={onLogout}
                className="px-4 py-2 rounded-md bg-white text-[#173B8A] hover:bg-[#F5F7FF] transition text-sm inline-flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
