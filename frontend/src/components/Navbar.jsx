import React from "react";
import { User, Building2, BriefcaseBusiness } from "lucide-react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-blue-900 text-white shadow-sm">
      <div className="max-w-full mx-auto pl-30 pr-20 py-4 flex justify-between items-center">
        {/* Logo */}
        <h1 className="text-2xl font-bold flex items-center gap-1">
           <BriefcaseBusiness size={30} color="orange"/>InternConnect
        </h1>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-20">
          <ul className="flex gap-6 text-gray-200 font-medium">
            <li><Link to="/Internships" className="nav-link">Find Internships</Link></li>
            <li><Link to="/Companies" className="nav-link">For Companies</Link></li>
            <li><Link to="/About" className="nav-link">About Us</Link></li>
          </ul>

          <div className="flex gap-3 items-center">
            <button className="btn-outline flex items-center gap-2 text-white-">
              <User size={18} /> Student Login
            </button>
            <button className="btn-outline flex items-center gap-2">
              <Building2 size={18} /> Employer Login
            </button>
            <button className="btn-primary">Get Started</button>
          </div>
        </div>

        {/* Mobile Only */}
        <div className="md:hidden">
          <button className="btn-primary">Get Started</button>
        </div>
      </div>
    </nav>
  );
}
