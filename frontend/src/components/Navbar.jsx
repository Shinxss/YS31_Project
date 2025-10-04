// frontend/src/components/Navbar.jsx
import React from "react";
import { Briefcase, User, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="bg-[#173B8A] text-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo + Brand */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#F37526] flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold">InternConnect</span>
        </Link>

        {/* MOBILE: only Get Started */}
        <Link
          to="/Signup"
          className="md:hidden inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#F37526] hover:bg-[#e56818] transition text-sm font-medium"
        >
          Get Started
        </Link>

        {/* DESKTOP/TABLET */}
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

          <div className="flex items-center gap-3">
            <Link
              to="/Login"
              className="px-4 py-2 border border-white/30 rounded-md hover:bg-white hover:text-[#173B8A] transition text-sm inline-flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Student Login
            </Link>
            <Link
              to="/Login"
              className="px-4 py-2 border border-white/30 rounded-md hover:bg-white hover:text-[#173B8A] transition text-sm inline-flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              Employer Login
            </Link>
            <Link
              to="/Signup"
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
