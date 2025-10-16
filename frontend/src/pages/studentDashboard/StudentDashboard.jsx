import React, { useState, useEffect } from "react";
import StudentSidebar from "@/components/studentDashboard/StudentSidebar";
import StudentHeaderBar from "@/components/studentDashboard/StudentHeaderBar";
import { getStudentProfile } from "@/services/api";
import { toast } from "react-toastify";
import BrowseJobs from "@/pages/studentDashboard/BrowseJobs";
import StudentProfile from "@/pages/studentDashboard/ProfilePage";
import MyApplications from "@/pages/studentDashboard/MyApplications"; // ✅ NEW: component file for applications

import { useNavigate } from "react-router-dom";
import {
  Plus,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  BarChart3,
} from "lucide-react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "@/styles/StudentDashboard.css";
import AddReminderModal from "@/components/studentDashboard/AddReminderModal"; // ✅ Imported Modal Component

export default function StudentDashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [student, setStudent] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    sent: 0,
    accepted: 0,
    rejected: 0,
    successRate: 0,
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
    type: "",
  });
  const [quickNote, setQuickNote] = useState(""); // ✅ keeps placeholder note
  const navigate = useNavigate();

  // ----------------------
  // ✅ API base resolver
  // ----------------------
  const RAW_BASE = (typeof window !== "undefined" && import.meta?.env?.VITE_API_BASE) || "";
  const IS_VITE = typeof window !== "undefined" && /:5173|:5174/.test(window.location.origin);
  const FALLBACK_BASE = IS_VITE ? "http://localhost:5000" : (typeof window !== "undefined" ? window.location.origin : "");
  const API_BASE = (RAW_BASE && RAW_BASE.trim().length > 0 ? RAW_BASE : FALLBACK_BASE).replace(/\/+$/,"");
  const REMINDERS_URL = `${API_BASE}/api/student/reminders`;

  // ✅ ADD: common auth headers using the token you store in localStorage
  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("ic_token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // ✅ fetch reminders from backend and show them in Upcoming Events
  const fetchReminders = async () => {
    try {
      const res = await fetch(REMINDERS_URL, {
        credentials: "include",
        headers: {
          ...getAuthHeaders(), // ✅ ADD auth header
        },
      });
      if (res.status === 401) {
        console.warn("Unauthorized when fetching reminders");
        toast.error("Session expired. Please log in again.");
        return;
      }
      if (!res.ok) throw new Error(`Failed to fetch reminders (${res.status})`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data.slice(0, 20) : []);
    } catch (err) {
      console.error("Fetch reminders error:", err, "URL:", REMINDERS_URL);
      setEvents([]);
    }
  };

  // ✅ save a reminder to backend
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
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(), // ✅ ADD auth header
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        throw new Error("No token provided");
      }
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
      console.error("Save reminder error:", err, "URL:", REMINDERS_URL);
      throw err;
    }
  };

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
        const studentData = data.student || data;
        setStudent(studentData);
      } catch (err) {
        toast.error("Failed to load student profile");
      }
    };
    fetchProfile();
    fetchDashboardData();
    fetchReminders(); // ✅ pull reminders on load
  }, []);

  // default time on open so required time passes
  useEffect(() => {
    if (showModal && !newEvent.time) {
      setNewEvent((prev) => ({ ...prev, time: "00:00" }));
    }
  }, [showModal]);

  const fetchDashboardData = () => {
    setDashboardStats({
      sent: 12,
      accepted: 2,
      rejected: 10,
      successRate: ((2 / 12) * 100).toFixed(2),
    });

    setRecentApplications([
      {
        title: "Software Engineering Intern",
        company: "TechCorp",
        location: "Dagupan City, Pangasinan",
        date: "3 Days ago",
        status: "Accepted",
      },
      {
        title: "Software Engineering Intern",
        company: "TechCorp",
        location: "Dagupan City, Pangasinan",
        date: "3 Days ago",
        status: "Application Sent",
      },
      {
        title: "Software Engineering Intern",
        company: "TechCorp",
        location: "Dagupan City, Pangasinan",
        date: "3 Days ago",
        status: "Rejected",
      },
    ]);
  };

  const handleSaveEvent = async () => {
    const { title, date, time, description, type } = newEvent;

    const normalizedTime = time || "00:00";
    if (!newEvent.time) {
      setNewEvent((prev) => ({ ...prev, time: normalizedTime }));
    }

    if (!title || !date || !normalizedTime || !type) {
      toast.error("Please fill all required fields.");
      return;
    }

    const eventData = { title, description, date, time: normalizedTime, type };

    // save to backend first (with Authorization)
    try {
      await saveReminderToDB(eventData);
    } catch (err) {
      toast.error(err.message || "Failed to save reminder");
      return;
    }

    // keep your local list behavior
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

    // refresh from server
    fetchReminders();
  };

  const tileClassName = ({ date }) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${d}`;
    const hasEvent = events.some((ev) => ev.date === key);
    return hasEvent ? "highlight-date" : "";
  };

  const handleNav = (label) => {
    if (label === "Settings") {
      navigate("/student/settings");
      return;
    }
    setActiveTab(label);
  };

  const handleQuickNoteKeyDown = (e) => {
    if (e.key === "Enter" && quickNote.trim()) {
      setNewEvent((prev) => ({
        ...prev,
        title: quickNote.trim(),
        date: selectedDate.toISOString().split("T")[0],
      }));
      setQuickNote("");
      setShowModal(true);
    }
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

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === "Dashboard" && (
            <div className="space-y-6">
              {/* HEADER */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back,{" "}
                  <span className="text-blue-700">
                    {student
                      ? `${student.firstName || ""} ${student.lastName || ""}`
                      : "Loading..."}
                    !
                  </span>
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Here's your internship journey overview
                </p>
              </div>

              {/* STATS CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  {
                    label: "Application Sent",
                    value: dashboardStats.sent,
                    icon: <Send size={16} className="text-gray-400" />,
                    note: "+4 from last week",
                  },
                  {
                    label: "Application Accepted",
                    value: dashboardStats.accepted,
                    icon: <CheckCircle2 size={16} className="text-gray-400" />,
                    note: "+1 from last week",
                  },
                  {
                    label: "Application Rejected",
                    value: dashboardStats.rejected,
                    icon: <XCircle size={16} className="text-gray-400" />,
                    note: "+5 from this week",
                  },
                  {
                    label: "Success Rate",
                    value: `${dashboardStats.successRate}%`,
                    icon: <BarChart3 size={16} className="text-gray-400" />,
                    note: "",
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl shadow-sm p-5 h-36 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-gray-500 text-sm">{stat.label}</p>
                      {stat.icon}
                    </div>
                    <h2 className="text-3xl font-bold text-[#173B8A]">
                      {stat.value}
                    </h2>
                    {stat.label === "Success Rate" ? (
                      <div className="w-full bg-gray-200 h-2 rounded-full">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-[#173B8A] to-[#F37526]"
                          style={{
                            width: `${dashboardStats.successRate}%`,
                          }}
                        ></div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">{stat.note}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* CONTENT GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT SIDE */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow p-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      📋 Recent Application
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Track your latest internship applications
                    </p>

                    <div className="space-y-4">
                      {recentApplications.map((app, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 flex items-center justify-between shadow-sm"
                        >
                          <div>
                            <h4 className="font-medium text-gray-800">
                              {app.title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {app.company}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <MapPin size={12} /> {app.location}
                              <Clock size={12} /> {app.date}
                            </div>
                          </div>
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              app.status === "Accepted"
                                ? "bg-green-100 text-green-700"
                                : app.status === "Rejected"
                                ? "bg-red-100 text-red-600"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE */}
                <div>
                  <div className="bg-white rounded-lg shadow p-5 mb-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      My Schedule
                    </h3>
                    <Calendar
                      onChange={setSelectedDate}
                      value={selectedDate}
                      tileClassName={tileClassName}
                    />
                  </div>

                  <div className="bg-white rounded-lg shadow p-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center justify-between">
                      Upcoming Events
                      <button
                        onClick={() => setShowModal(true)}
                        className="text-sm flex items-center gap-1 bg-orange-500 text-white px-2 py-1 rounded-md hover:bg-orange-600"
                      >
                        <Plus size={14} /> Add
                      </button>
                    </h3>

                    {/* Placeholder input */}
                    <input
                      type="text"
                      placeholder="Add a note or reminder..."
                      className="w-full border rounded-md px-3 py-2 mb-3 text-sm"
                      value={quickNote}
                      onChange={(e) => setQuickNote(e.target.value)}
                      onKeyDown={handleQuickNoteKeyDown}
                    />

                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {events.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">
                          No reminders added yet.
                        </p>
                      ) : (
                        events.map((ev, i) => (
                          <div
                            key={i}
                            className="border-l-4 border-blue-600 bg-blue-50 p-2 rounded"
                          >
                            <p className="font-medium text-sm text-gray-800">
                              {ev.title}{" "}
                              <span className="text-xs text-gray-500">
                                ({ev.type})
                              </span>
                            </p>
                            <p className="text-xs text-gray-600">
                              {ev.date} • {ev.time}
                            </p>
                            {ev.description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {ev.description}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Browse Jobs" && (
            <div className="space-y-6">
              <BrowseJobs />
            </div>
          )}

          {activeTab === "Profile" && (
            <div className="space-y-6">
              <StudentProfile />
            </div>
          )}

          {/* ✅ Replaced the old inline placeholder with the new component */}
          {activeTab === "My Applications" && (
            <MyApplications />
          )}
        </main>
      </div>

      {/* ✅ MODAL imported from component */}
      <AddReminderModal
        showModal={showModal}
        setShowModal={setShowModal}
        newEvent={newEvent}
        setNewEvent={setNewEvent}
        handleSaveEvent={handleSaveEvent}
      />
    </div>
  );
}
