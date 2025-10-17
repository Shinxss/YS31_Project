import React, { useState, useEffect, useMemo } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import StudentSidebar from "@/components/studentDashboard/StudentSidebar";
import StudentHeaderBar from "@/components/studentDashboard/StudentHeaderBar";
import StudentDashboardHome from "@/pages/studentDashboard/studentDashboardHome";
import BrowseJobs from "@/pages/studentDashboard/BrowseJobs";
import MyApplications from "@/pages/studentDashboard/MyApplications";
import StudentProfile from "@/pages/studentDashboard/ProfilePage";
import "@/styles/StudentDashboard.css";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function StudentDashboard() {
  const navigate = useNavigate();

  // 🔐 Auth
  const { token, role } = useMemo(
    () => ({
      token: localStorage.getItem("ic_token"),
      role: localStorage.getItem("ic_role"),
    }),
    []
  );

  useEffect(() => {
    if (!token || role !== "student") {
      navigate("/login", { replace: true });
    }
  }, [token, role, navigate]);

  // Sidebar
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("ic_student_sidebar");
    return saved === "1";
  });

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem("ic_student_sidebar", next ? "1" : "0");
      return next;
    });
  };

  // Profile info
  const [student, setStudent] = useState({
    firstName: "",
    lastName: "",
    course: "",
    profilePicture: "",
  });

  // Load student profile
  useEffect(() => {
    if (!token || role !== "student") return;
    let ignore = false;
    const ctrl = new AbortController();

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/student/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        if (!ignore && data) {
          setStudent(data.student || data);
        }
      } catch (err) {
        console.error("Load student/me failed:", err);
      }
    })();

    return () => {
      ignore = true;
      ctrl.abort();
    };
  }, [token, role]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("ic_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <div className="min-h-screen bg-[#ECF3FC] flex">
      {/* Sidebar */}
      <StudentSidebar
        collapsed={collapsed}
        active="Dashboard"
        onLogout={() => doLogout(navigate)}
        onNav={(label) => navigate(label === "Dashboard" ? "/student" : `/student/${label.toLowerCase().replace(/\s/g, "-")}`)}
      />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <StudentHeaderBar
          student={student}
          onToggleSidebar={toggleCollapsed}
          title="Dashboard"
        />

        {/* Main content */}
        <main className="p-6 overflow-y-auto">
          <Routes>
            <Route
              path="/"
              element={
                <StudentDashboardHome
                  student={student}
                  API_BASE={API_BASE}
                  getAuthHeaders={getAuthHeaders}
                />
              }
            />
            <Route path="browse-jobs" element={<BrowseJobs />} />
            <Route path="my-applications" element={<MyApplications />} />
            <Route path="profile" element={<StudentProfile />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function doLogout(navigate) {
  localStorage.removeItem("ic_token");
  localStorage.removeItem("ic_role");
  localStorage.removeItem("ic_profile");
  navigate("/", { replace: true });
}
