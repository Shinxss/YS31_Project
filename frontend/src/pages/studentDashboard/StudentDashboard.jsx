import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import StudentSidebar from "@/components/studentDashboard/StudentSidebar.jsx";
import StudentHeaderBar from "@/components/studentDashboard/StudentHeaderBar.jsx";
import { getStudentProfile } from "@/services/api";

import StudentDashboardHome from "@/pages/studentDashboard/StudentDashboardHome.jsx";
import BrowseJobs from "@/pages/studentDashboard/BrowseJobs.jsx";
import StudentProfile from "@/pages/studentDashboard/ProfilePage.jsx";
import MyApplications from "@/pages/studentDashboard/MyApplications.jsx";

/* ---------------------- helpers ---------------------- */
const timeAgo = (d) => {
  const diff = Math.max(0, Date.now() - new Date(d).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min${m > 1 ? "s" : ""} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const dy = Math.floor(h / 24);
  return `${dy} day${dy > 1 ? "s" : ""} ago`;
};

export default function StudentDashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [student, setStudent] = useState(null);

  // stats (demo)
  const [dashboardStats, setDashboardStats] = useState({
    sent: 0,
    accepted: 0,
    rejected: 0,
    successRate: 0,
  });

  // recent applications list (from backend)
  const [recentApplications, setRecentApplications] = useState([]);
  const [recentAppsLoading, setRecentAppsLoading] = useState(true);
  const [recentAppsError, setRecentAppsError] = useState("");

  // reminders (I/O stays in container)
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
    type: "",
  });
  const [quickNote, setQuickNote] = useState("");

  const navigate = useNavigate();

  /* ---------------------- API base resolver ---------------------- */
  const RAW_BASE =
    (typeof window !== "undefined" && import.meta?.env?.VITE_API_BASE) || "";
  const IS_VITE =
    typeof window !== "undefined" &&
    /:5173|:5174/.test(window.location.origin);
  const FALLBACK_BASE = IS_VITE
    ? "http://localhost:5000"
    : typeof window !== "undefined"
    ? window.location.origin
    : "";
  const API_BASE = (RAW_BASE && RAW_BASE.trim().length > 0
    ? RAW_BASE
    : FALLBACK_BASE
  ).replace(/\/+$/, "");
  const REMINDERS_URL = `${API_BASE}/api/student/reminders`;

  // auth header
  const getAuthHeaders = () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("ic_token")
        : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  /* ---------------------- Reminders API ---------------------- */
  const fetchReminders = async () => {
    try {
      const res = await fetch(REMINDERS_URL, {
        credentials: "include",
        headers: { ...getAuthHeaders() },
      });
      if (res.status === 401) {
        toast.error("Session expired. Please log in again.");
        return;
      }
      if (!res.ok) throw new Error(`Failed to fetch reminders (${res.status})`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data.slice(0, 20) : []);
    } catch (err) {
      console.error("Fetch reminders error:", err);
      setEvents([]);
    }
  };

  const saveReminderToDB = async (eventData) => {
    try {
      const payload = {
        title: (eventData.title || "").trim(),
        description: (eventData.description || "").trim(),
        date: eventData.date || "",
        time: eventData.time || "00:00",
        type: eventData.type || "Other",
        reminder: {
          title: (eventData.title || "").trim(),
          description: (eventData.description || "").trim(),
          date: eventData.date || "",
          time: eventData.time || "00:00",
          type: eventData.type || "Other",
        },
      };

      const res = await fetch(REMINDERS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.status === 401) throw new Error("No token provided");
      if (!res.ok) {
        let msg = `Failed to save reminder (${res.status})`;
        try {
          const j = await res.json();
          if (j?.message) msg = j.message;
        } catch {}
        throw new Error(msg);
      }
      return res.json();
    } catch (err) {
      console.error("Save reminder error:", err);
      throw err;
    }
  };

  const handleSaveEvent = async () => {
    const { title, date, time, description, type } = newEvent;
    const normalizedTime = time || "00:00";

    if (!title || !date || !normalizedTime || !type) {
      toast.error("Please fill all required fields.");
      return;
    }

    const eventData = { title, description, date, time: normalizedTime, type };

    try {
      await saveReminderToDB(eventData);
    } catch (err) {
      toast.error(err.message || "Failed to save reminder");
      return;
    }

    setEvents((prev) => [...prev, eventData]);
    toast.success("Reminder added!");
    setShowModal(false);
    setNewEvent({
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      time: "",
      type: "",
    });
    fetchReminders();
  };

  /* ---------------------- Applications API ---------------------- */
  const fetchStudentApplications = async () => {
    try {
      setRecentAppsLoading(true);
      setRecentAppsError("");

      const res = await fetch(`${API_BASE}/api/student/applications`, {
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Failed to load applications");

      const apps = Array.isArray(data?.applications) ? data.applications : [];

      const normalized = apps
        .map((a) => {
          const j = a.job || {};
          return {
            title: j.title || "—",
            company: j.companyName || "—",
            location: j.location || "—",
            date: timeAgo(a.createdAt || Date.now()),
            status: a.status || "Application Sent",
          };
        })
        .slice(0, 5);

      setRecentApplications(normalized);
    } catch (e) {
      setRecentAppsError(e.message || "Failed to load applications");
      setRecentApplications([]);
    } finally {
      setRecentAppsLoading(false);
    }
  };

  /* ---------------------- lifecycle ---------------------- */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getStudentProfile();
        const studentData = data.student || data;
        setStudent(studentData);

        // load apps after we know we're authenticated
        fetchStudentApplications();
      } catch {
        toast.error("Failed to load student profile");
        // still try to fetch apps if token exists
        fetchStudentApplications();
      }
    };
    fetchProfile();

    setDashboardStats({
      sent: 12,
      accepted: 2,
      rejected: 10,
      successRate: ((2 / 12) * 100).toFixed(2),
    });

    fetchReminders();
  }, []);

  /* ---------------------- nav & session ---------------------- */
  const handleLogout = () => {
    localStorage.removeItem("ic_token");
    localStorage.removeItem("ic_role");
    localStorage.removeItem("ic_profile");
    window.location.href = "/";
  };

  const handleNav = (label) => {
    if (label === "Settings") {
      navigate("/student/settings");
      return;
    }
    setActiveTab(label);
  };

  return (
    <div className="flex h-screen bg-[#ECF3FC] overflow-hidden">
      {/* Sidebar */}
      <StudentSidebar
        collapsed={collapsed}
        active={activeTab}
        onLogout={handleLogout}
        onNav={handleNav}
      />

      <div className="flex flex-col flex-1 h-screen">
        <div className="flex-shrink-0">
          <StudentHeaderBar
            student={
              student || {
                firstName: "",
                lastName: "",
                course: "",
                profilePicture: "",
              }
            }
            onToggleSidebar={() => setCollapsed(!collapsed)}
            title={activeTab}
          />
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === "Dashboard" && (
            <StudentDashboardHome
              /* identity & stats */
              student={student}
              dashboardStats={dashboardStats}

              /* recent applications */
              recentApplications={recentApplications}
              recentAppsLoading={recentAppsLoading}
              recentAppsError={recentAppsError}

              /* reminders panel control + data */
              events={events}
              showModal={showModal}
              setShowModal={setShowModal}
              newEvent={newEvent}
              setNewEvent={setNewEvent}
              quickNote={quickNote}
              setQuickNote={setQuickNote}
              onSaveEvent={handleSaveEvent}

              /* infra for child requests (recommended jobs uses these) */
              API_BASE={API_BASE}
              getAuthHeaders={getAuthHeaders}
            />
          )}

          {activeTab === "Browse Jobs" && <BrowseJobs />}
          {activeTab === "Profile" && <StudentProfile />}
          {activeTab === "My Applications" && <MyApplications />}
        </main>
      </div>
    </div>
  );
}
