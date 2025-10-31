import React from "react";
import { Briefcase, User, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import ic_logo from "../assets/ic_logo.svg";

export default function Navbar() {
  return (
    <header className="bg-[#173B8A] text-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo + Brand */}
        <Link to="/" className="flex items-center gap-3">
          <img src={ic_logo} alt="InternConnect Logo" className="w-8 h-8 rounded-md" />
          <span className="text-xl font-bold">InternConnect</span>
        </Link>

        {/* MOBILE: only Get Started */}
        <Link
          to="/signup"
          className="md:hidden inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#F37526] hover:bg-[#e56818] transition text-sm font-medium"
        >
          Get Started
        </Link>

        {/* DESKTOP/TABLET */}
        <div className="hidden md:flex items-center gap-10">
          <nav className="flex items-center gap-10 text-sm">
            <Link to="/internships" className="hover:text-[#F5A66E] hover:font-medium transition">
              Find Opportunities
            </Link>
            <Link to="/companies" className="hover:text-[#F5A66E] hover:font-medium transition">
              For Companies
            </Link>
            <Link to="/about" className="hover:text-[#F5A66E] hover:font-medium transition">
              About Us
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* ✅ Student Login */}
            <Link
              to="/login?tab=student"
              className="px-4 py-2 border border-white/30 rounded-md hover:bg-white hover:text-[#173B8A] transition text-sm inline-flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Student Login
            </Link>

            {/* ✅ Employer Login */}
            <Link
              to="/login?tab=company"
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
        </div>
      </div>
    </header>
  );
}
