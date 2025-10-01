import React from "react";
import { Facebook, Instagram, Twitter, Music2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-blue-900 text-gray-200 py-12 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10">
        {/* Brand */}
        <div>
          <h2 className="text-white font-bold text-2xl">InternConnect</h2>
          <p className="text-gray-400 mt-3">
            Connecting students with their dream internships and companies with top talent.
          </p>
          <div className="flex gap-4 mt-4 text-xl">
            <a href="#"><Facebook /></a>
            <a href="#"><Instagram /></a>
            <a href="#"><Twitter /></a>
          </div>
        </div>

        {/* Site Map */}
        <div>
          <h3 className="text-white font-semibold mb-3">Site Map</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-orange-400">Create Profile</a></li>
            <li><a href="#" className="hover:text-orange-400">Find Internships</a></li>
            <li><a href="#" className="hover:text-orange-400">Post Opportunities</a></li>
            <li><a href="#" className="hover:text-orange-400">About Us</a></li>
            <li><a href="#" className="hover:text-orange-400">Contact Us</a></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="text-white font-semibold mb-3">Legal</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-orange-400">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-orange-400">Terms of Service</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-600 mt-10 pt-6 text-center text-gray-400 text-sm">
        © 2025 InternConnect. All rights reserved.
      </div>
    </footer>
  );
}
