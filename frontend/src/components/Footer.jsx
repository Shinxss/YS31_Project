import React from "react";

export default function Footer() {
  return (
    <footer className="bg-[#173B8A] text-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-10">
        <div>
          <h3 className="text-2xl font-bold text-white">InternConnect</h3>
          <p className="mt-3 text-gray-300">
            Connecting students with their dream internships and companies with top talent.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">Site Map</h4>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-white">Create Profile</a></li>
            <li><a href="#" className="hover:text-white">Find Internships</a></li>
            <li><a href="#" className="hover:text-white">Post Opportunities</a></li>
            <li><a href="#" className="hover:text-white">About Us</a></li>
            <li><a href="#" className="hover:text-white">Contact Us</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">Legal</h4>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white">Terms of Service</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-10">
        <div className="h-px bg-white/20 mb-6" />
        <p className="text-sm text-gray-300">© 2025 InternConnect. All rights reserved.</p>
      </div>
    </footer>
  );
}
