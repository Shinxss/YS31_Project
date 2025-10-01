import React from "react";
import { Users, Search, Bell, FileText, Building2, ClipboardList, BarChart3, Tag } from "lucide-react";

export default function Features() {
  return (
    <section className="py-20 bg-blue-50">
      <h2 className="section-title">
        Everything You Need to <span className="text-orange-500">Succeed</span>
      </h2>
      <p className="section-subtitle">
        Whether you're a student seeking opportunities or a company looking for
        talent, we have the tools to make it happen.
      </p>

      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mt-12 px-6">
        {/* Students */}
        <div>
          <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
            <Users size={24} /> For Students
          </h3>
          <div className="card flex items-start gap-4 h-32 p-6">
            <Search size={28} className="text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-lg">Search & Apply Easily</p>
              <p className="text-sm text-gray-600">Find internships by location, skills, or field.</p>
            </div>
          </div>
          <div className="card flex items-start gap-4 h-32 p-6 mt-6">
            <Bell size={28} className="text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-lg">Real-time Notifications</p>
              <p className="text-sm text-gray-600">Get instant updates on application status.</p>
            </div>
          </div>
          <div className="card flex items-start gap-4 h-32 p-6 mt-6">
            <FileText size={28} className="text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-lg">Application Tracking</p>
              <p className="text-sm text-gray-600">Manage all applications in one place.</p>
            </div>
          </div>
        </div>

        {/* Companies */}
        <div>
          <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
            <Building2 size={24} /> For Companies
          </h3>
          <div className="card flex items-start gap-4 h-32 p-6">
            <ClipboardList size={28} className="text-orange-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-lg">Post Opportunities</p>
              <p className="text-sm text-gray-600">List internships and jobs for students.</p>
            </div>
          </div>
          <div className="card flex items-start gap-4 h-32 p-6 mt-6">
            <BarChart3 size={28} className="text-orange-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-lg">Analytics Dashboard</p>
              <p className="text-sm text-gray-600">Manage applications with insights.</p>
            </div>
          </div>
          <div className="card flex items-start gap-4 h-32 p-6 mt-6">
            <Tag size={28} className="text-orange-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-lg">Company Branding</p>
              <p className="text-sm text-gray-600">Showcase your brand to attract talent.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
