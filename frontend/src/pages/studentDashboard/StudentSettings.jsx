// src/pages/studentDashboard/StudentSettings.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import StudentHeaderBar from "../../components/studentDashboard/StudentHeaderBar.jsx";
import StudentSidebar from "../../components/studentDashboard/StudentSidebar.jsx";

// ⚠️ Robust imports that work with either default or named exports
import * as PwdMod from "./settings/PasswordAndSecurity.jsx";
import * as ProfMod from "./ProfilePage.jsx";

// moved to components/
import * as TosMod from "@/components/TermsOfService.jsx";
import * as PrivMod from "@/components/PrivacyPolicy.jsx";

const StudentPasswordAndSecurity =
  PwdMod.default || PwdMod.PasswordAndSecurity || PwdMod.StudentPasswordAndSecurity;

const StudentProfileDetails =
  ProfMod.default || ProfMod.ProfileDetails || ProfMod.StudentProfileDetails;

const StudentTermsOfService =
  TosMod.default || TosMod.TermsOfService || TosMod.StudentTermsOfService;

const StudentPrivacyPolicy =
  PrivMod.default || PrivMod.PrivacyPolicy || PrivMod.StudentPrivacyPolicy;

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function StudentSettings() {
  const navigate = useNavigate();
  const location = useLocation();

  const { token, role } = useMemo(
    () => ({
      token: localStorage.getItem("ic_token"),
      role: localStorage.getItem("ic_role"),
    }),
    []
  );

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("ic_student_sidebar");
    return saved === "1";
  });

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState({
    firstName: "",
    lastName: "",
    course: "",
    profilePicture: "",
    role: "Student",
  });

  useEffect(() => {
    if (!token || role !== "student") {
      navigate("/login", { replace: true });
    }
  }, [token, role, navigate]);

  useEffect(() => {
    if (!token || role !== "student") return;
    let ignore = false;
    const ctrl = new AbortController();

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/student/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ctrl.signal,
        });

        if (res.status === 401 || res.status === 403) {
          doLogout(navigate);
          return;
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load student");

        if (!ignore) {
          const s = data?.student || data || {};
          setStudent({
            firstName: s.firstName || s.user?.firstName || "",
            lastName: s.lastName || s.user?.lastName || "",
            course: s.course || "",
            profilePicture: s.profilePicture || "",
            role: s.role || s.user?.role || "Student",
          });
        }
      } catch (e) {
        if (!ignore && e.name !== "AbortError") {
          console.error("Load /student/me failed:", e);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
      ctrl.abort();
    };
  }, [token, role, navigate]);

  const headerTitle = (() => {
    const p = location.pathname;
    if (p.startsWith("/student/settings/password")) return "Password & Security";
    if (p.startsWith("/student/settings/profile")) return "Profile Details";
    if (p.startsWith("/student/settings/terms")) return "Terms of Service";
    if (p.startsWith("/student/settings/privacy")) return "Privacy Policy";
    return "Settings";
  })();

  return (
    <div className="min-h-screen bg-[#ECF3FC] flex">
      <StudentSidebar
        collapsed={collapsed}
        onLogout={() => doLogout(navigate)}
        onNav={(label) => {
          if (label === "Dashboard") navigate("/student");
          if (label === "Browse Jobs") navigate("/student/browse");
          if (label === "My Applications") navigate("/student/applications");
          if (label === "Profile") navigate("/student/profile");
          if (label === "Settings") navigate("/student/settings");
        }}
      />

      <div className="flex-1 flex flex-col">
        <StudentHeaderBar
          student={student}
          onToggleSidebar={() => {
            const next = !collapsed;
            setCollapsed(next);
            localStorage.setItem("ic_student_sidebar", next ? "1" : "0");
          }}
          title={headerTitle}
        />

        <main className="p-6">
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : (
            <Routes>
              <Route path="/" element={<StudentPasswordAndSecurity />} />
              <Route path="password" element={<StudentPasswordAndSecurity />} />
              <Route path="profile" element={<StudentProfileDetails />} />
              <Route path="terms" element={<StudentTermsOfService />} />
              <Route path="privacy" element={<StudentPrivacyPolicy />} />
            </Routes>
          )}
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
