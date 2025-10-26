// src/pages/studentDashboard/StudentDashboard.jsx
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";

import StudentSidebar from "@/components/studentDashboard/StudentSidebar.jsx";
import StudentHeaderBar from "@/components/studentDashboard/StudentHeaderBar.jsx";
import { getStudentProfile } from "@/services/api";

import StudentDashboardHome from "@/pages/studentDashboard/StudentDashboardHome.jsx";
import BrowseJobs from "@/pages/studentDashboard/BrowseJobs.jsx";
import StudentProfile from "@/pages/studentDashboard/ProfilePage.jsx";
import MyApplications from "@/pages/studentDashboard/MyApplications.jsx";
import StudentNotifications from "../studentDashboard/Notifications";

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
  const location = useLocation();
  const navigate = useNavigate();

  const VALID_TABS = new Set([
    "Dashboard",
    "Browse Jobs",
    "Profile",
    "My Applications",
    "Notifications",
  ]);

  const getInitialTab = () => {
    if (location.pathname.startsWith("/student/notifications")) {
      return "Notifications";
    }
    const params = new URLSearchParams(location.search);
    const fromQuery = params.get("tab");
    if (fromQuery && VALID_TABS.has(fromQuery)) return fromQuery;
    try {
      const fromStorage = localStorage.getItem("student_activeTab");
      if (fromStorage && VALID_TABS.has(fromStorage)) return fromStorage;
    } catch {}
    return "Dashboard";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [student, setStudent] = useState(null);

  const [dashboardStats, setDashboardStats] = useState({
    sent: 0,
    accepted: 0,
    rejected: 0,
    successRate: 0,
  });

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

  /* ---------------------- API base resolver ---------------------- */
  const RAW_BASE =
    (typeof window !== "undefined" && import.meta?.env?.VITE_API_BASE) || "";
  const IS_VITE =
    typeof window !== "undefined" && /:5173|:5174/.test(window.location.origin);
  const FALLBACK_BASE = IS_VITE
    ? "http://localhost:5000"
    : typeof window !== "undefined"
    ? window.location.origin
    : "";
  const API_BASE = (RAW_BASE && RAW_BASE.trim().length > 0
    ? RAW_BASE
    : FALLBACK_BASE
  ).replace(/\/+$/, "");

  // ✅ use plural “students” to match your router mount
  const REMINDERS_URL = `${API_BASE}/api/students/reminders`;
  const APPLICATIONS_URL = `${API_BASE}/api/students/applications`;

  const getAuthHeaders = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("ic_token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const buildImageUrl = (raw) => {
    if (!raw) return "";
    let v = String(raw).trim();
    if (/^(https?:\/\/|\/|blob:|data:image)/i.test(v)) return v;
    v = v.replace(/^\/+/, "").replace(/^uploads\//i, "");
    return `${API_BASE}/uploads/${encodeURIComponent(v)}`;
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
      const data = await res.json().catch(() => ({}));
      // controller typically returns { reminders: [...] }
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.reminders)
        ? data.reminders
        : [];
      setEvents(list.slice(0, 50));
    } catch (err) {
      console.error("Fetch reminders error:", err);
      setEvents([]);
    }
  };

  const createReminderOnServer = async (eventData) => {
    const payload = {
      // your addReminder accepts both top-level or reminder object
      ...eventData,
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
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || `Failed to save reminder (${res.status})`);
    return data; // { message, reminders }
  };

  const updateReminderOnServer = async (eventData) => {
    const id = eventData?._id || eventData?.id;
    if (!id) throw new Error("Missing reminder id");
    const res = await fetch(`${API_BASE}/api/students/me/reminders/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      // your controller reads either body or body.reminder
      body: JSON.stringify({ reminder: eventData }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to update reminder");
    return data; // { message, reminder, reminders }
  };

  const deleteReminderOnServer = async (reminderId) => {
    const res = await fetch(`${API_BASE}/api/students/me/reminders/${reminderId}`, {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to delete reminder");
    return data; // { message, reminders }
  };

  // 🔁 unified handler that the child calls with { op, ... }
  const handleSaveEvent = async (action) => {
    const { op } = action || {};

    // ------- DELETE (no validation) -------
    if (op === "delete") {
      try {
        // if child already did server delete, prefer its fresh list
        if (action.serverDone && Array.isArray(action.reminders)) {
          setEvents(action.reminders);
          toast.success("Reminder deleted");
          return;
        }
        if (action.id) {
          const { reminders } = await deleteReminderOnServer(action.id);
          setEvents(Array.isArray(reminders) ? reminders : []);
          toast.success("Reminder deleted");
        } else if (typeof action.index === "number") {
          // fallback UI-only remove
          setEvents((prev) => prev.filter((_, i) => i !== action.index));
          toast.success("Reminder deleted");
        } else {
          toast.error("Missing reminder id.");
        }
      } catch (err) {
        console.error(err);
        toast.error(err?.message || "Failed to delete reminder");
      }
      return;
    }

    // ------- CREATE / UPDATE (validate) -------
    if (op === "create" || op === "update") {
      const ev = action.event || {};
      const title = (ev.title || "").trim();
      const date = ev.date || "";
      const time = ev.time || "00:00";
      const type = ev.type || "Other";

      if (!title || !date || !time || !type) {
        toast.error("Please fill all required fields.");
        return;
      }

      try {
        if (op === "create") {
          const { reminders } = await createReminderOnServer({
            ...ev,
            title,
            date,
            time,
            type,
          });
          setEvents(Array.isArray(reminders) ? reminders : []);
          toast.success("Reminder added!");
          setShowModal(false);
          setNewEvent({
            title: "",
            description: "",
            date: new Date().toISOString().split("T")[0],
            time: "",
            type: "",
          });
        } else {
          const { reminders } = await updateReminderOnServer(ev);
          setEvents(Array.isArray(reminders) ? reminders : []);
          toast.success("Reminder updated");
          setShowModal(false);
          setNewEvent({
            title: "",
            description: "",
            date: new Date().toISOString().split("T")[0],
            time: "",
            type: "",
          });
        }
      } catch (err) {
        console.error(err);
        toast.error(err?.message || "Failed to save reminder");
      }
      return;
    }
  };

  /* ---------------------- Applications API ---------------------- */
  const fetchStudentApplications = async () => {
    try {
      setRecentAppsLoading(true);
      setRecentAppsError("");

      // ✅ plural “students”
      const res = await fetch(APPLICATIONS_URL, {
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

  /* ---------------------- sync URL & storage with activeTab ---------------------- */
  useEffect(() => {
    try {
      localStorage.setItem("student_activeTab", activeTab);
    } catch {}

    if (activeTab === "Notifications") {
      if (
        !location.pathname.startsWith("/student/notifications") ||
        location.search
      ) {
        navigate({ pathname: "/student/notifications", search: "" }, { replace: true });
      }
    } else {
      const params = new URLSearchParams(location.search);
      if (params.get("tab") !== activeTab || location.pathname !== "/student") {
        params.set("tab", activeTab);
        navigate({ pathname: "/student", search: params.toString() }, { replace: true });
      }
    }
  }, [activeTab, location.pathname, location.search, navigate]);

  /* ---------------------- lifecycle ---------------------- */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getStudentProfile();
        const studentData = data.student || data;
        setStudent(studentData);
        fetchStudentApplications();
      } catch {
        toast.error("Failed to load student profile");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------- nav & session ---------------------- */
  const handleLogout = () => {
    localStorage.removeItem("ic_token");
    localStorage.removeItem("ic_role");
    localStorage.removeItem("ic_profile");
    localStorage.removeItem("student_activeTab");
    window.location.href = "/";
  };

  const handleNav = (label) => {
    if (label === "Settings") {
      navigate("/student/settings");
      return;
    }
    if (VALID_TABS.has(label)) setActiveTab(label);
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
            student={{
              firstName: student?.firstName || "",
              lastName: student?.lastName || "",
              course: student?.course || "",
              profilePicture: buildImageUrl(student?.profilePicture || ""),
            }}
            onToggleSidebar={() => setCollapsed(!collapsed)}
            title={activeTab}
          />
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === "Dashboard" && (
            <StudentDashboardHome
              student={student}
              dashboardStats={dashboardStats}
              recentApplications={recentApplications}
              recentAppsLoading={recentAppsLoading}
              recentAppsError={recentAppsError}
              events={events}
              showModal={showModal}
              setShowModal={setShowModal}
              newEvent={newEvent}
              setNewEvent={setNewEvent}
              quickNote={quickNote}
              setQuickNote={setQuickNote}
              onSaveEvent={handleSaveEvent}
              API_BASE={API_BASE}
              getAuthHeaders={getAuthHeaders}
            />
          )}

          {activeTab === "Browse Jobs" && <BrowseJobs API_BASE={API_BASE} />}

          {activeTab === "Profile" && <StudentProfile />}

          {activeTab === "My Applications" && <MyApplications />}

          {activeTab === "Notifications" && <StudentNotifications />}
        </main>
      </div>
    </div>
  );
}
