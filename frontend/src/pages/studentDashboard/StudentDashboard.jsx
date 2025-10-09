import React, { useState, useEffect } from "react";
import StudentSidebar from "@/components/studentDashboard/StudentSidebar";
import StudentHeaderBar from "@/components/studentDashboard/StudentHeaderBar";
import { getStudentProfile } from "@/services/api";
import { toast } from "react-toastify";
import BrowseJobs from "@/components/studentDashboard/BrowseJobs"; // ✅ import

export default function StudentDashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [student, setStudent] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("ic_token");
    localStorage.removeItem("ic_role");
    localStorage.removeItem("ic_profile");
    window.location.href = "/";
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getStudentProfile();
        setStudent(data);
      } catch (err) {
        toast.error("Failed to load student profile");
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="flex h-screen bg-[#ECF3FC] overflow-hidden">
      {/* Sidebar stays fixed height */}
      <StudentSidebar
        collapsed={collapsed}
        active={activeTab}
        onLogout={handleLogout}
        onNav={setActiveTab}
      />

      {/* Main Section (Header + Scrollable Content) */}
      <div className="flex flex-col flex-1 h-screen">
        {/* HeaderBar fixed at top */}
        <div className="flex-shrink-0">
          <StudentHeaderBar
            student={student || { firstName: "", lastName: "", course: "" }}
            onToggleSidebar={() => setCollapsed(!collapsed)}
          />
        </div>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === "Browse Jobs" && (
            <div className="text-left">
              <BrowseJobs />
            </div>
          )}

          {activeTab === "Dashboard" && (
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                Welcome, {student?.firstName || "Student"}!
              </h2>
              <p className="text-gray-700">This is your student dashboard.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
