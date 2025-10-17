import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
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
import AddReminderModal from "@/components/studentDashboard/AddReminderModal";

export default function StudentDashboardHome({ student, API_BASE, getAuthHeaders }) {
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
  const [quickNote, setQuickNote] = useState("");
  const [sentWeekNote, setSentWeekNote] = useState("");
  const [randomJob, setRandomJob] = useState(null);

  // -------- API URLs --------
  const REMINDERS_URL = `${API_BASE}/api/student/reminders`;
  const APPLICATIONS_URL = `${API_BASE}/api/student/applications`;
  const APPLICATIONS_SUMMARY_URL = `${API_BASE}/api/student/applications/summary`;
  const APPLICATIONS_THIS_WEEK_URL = `${API_BASE}/api/student/applications/summary/week`;
  const RANDOM_JOB_URL = `${API_BASE}/api/jobs/random`;

  // -------- Fetch Helpers --------
  const fetchJson = async (url, { allow404 = false } = {}) => {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      credentials: "include",
    });
    if (res.status === 401) {
      toast.error("Please log in to view data.");
      return null;
    }
    if (res.status === 404 && allow404) return null;
    if (!res.ok) {
      let msg = `Failed to fetch (${res.status})`;
      try {
        const j = await res.json();
        if (j?.message) msg = j.message;
      } catch {}
      throw new Error(msg);
    }
    return res.json();
  };

  // -------- Parse Application Counts --------
  const parseCounts = (data) => {
    let total = 0,
      accepted = 0,
      rejected = 0;
    if (!data) return { total, accepted, rejected, successRate: 0 };

    if (data.total !== undefined) {
      total = Number(data.total ?? 0);
      accepted = Number(data.accepted ?? 0);
      rejected = Number(data.rejected ?? 0);
    } else if (Array.isArray(data)) {
      total = data.length;
      accepted = data.filter((a) => a.status === "Accepted").length;
      rejected = data.filter((a) => a.status === "Rejected").length;
    } else if (Array.isArray(data?.applications)) {
      total = data.applications.length;
      accepted = data.applications.filter((a) => a.status === "Accepted").length;
      rejected = data.applications.filter((a) => a.status === "Rejected").length;
    }

    const successRate = total > 0 ? ((accepted / total) * 100).toFixed(2) : 0;
    return { total, accepted, rejected, successRate };
  };

  // -------- Fetch Dashboard Stats --------
  const fetchApplicationsCount = async () => {
    try {
      let data = await fetchJson(APPLICATIONS_SUMMARY_URL);
      if (!data) return;

      const parsed = parseCounts(data);
      if (parsed.total === 0 && parsed.accepted === 0 && parsed.rejected === 0) {
        data = await fetchJson(APPLICATIONS_URL);
        if (!data) return;
      }

      const { total, accepted, rejected, successRate } = parseCounts(data);
      setDashboardStats({
        sent: total,
        accepted,
        rejected,
        successRate,
      });
    } catch (err) {
      console.error("fetchApplicationsCount error:", err);
    }
  };

  const fetchApplicationsThisWeek = async () => {
    try {
      const data = await fetchJson(APPLICATIONS_THIS_WEEK_URL, { allow404: true });
      if (!data) {
        setSentWeekNote("+0 added this week");
        return;
      }
      const added = Number(data.addedThisWeek ?? 0);
      setSentWeekNote(`+${added} added this week`);
    } catch (err) {
      console.error("fetchApplicationsThisWeek error:", err);
    }
  };

  // -------- Reminders --------
  const fetchReminders = async () => {
    try {
      const res = await fetch(REMINDERS_URL, { headers: { ...getAuthHeaders() } });
      if (!res.ok) throw new Error("Failed to fetch reminders");
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
      };
      const res = await fetch(REMINDERS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save reminder");
      return res.json();
    } catch (err) {
      console.error("Save reminder error:", err);
      toast.error("Failed to save reminder");
      throw err;
    }
  };

  const handleSaveEvent = async () => {
    const { title, date, time, description, type } = newEvent;
    if (!title || !date || !type) {
      toast.error("Please fill all required fields.");
      return;
    }
    try {
      await saveReminderToDB(newEvent);
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
    } catch (err) {
      toast.error("Failed to save reminder");
    }
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

  // -------- Random Job --------
  const fetchRandomJob = async () => {
    try {
      const res = await fetch(RANDOM_JOB_URL);
      if (!res.ok) throw new Error("No jobs available");
      const job = await res.json();
      setRandomJob(job);
    } catch (err) {
      console.warn("Random job fetch failed:", err);
      setRandomJob(null);
    }
  };

  // -------- Effects --------
  useEffect(() => {
    fetchApplicationsCount();
    fetchApplicationsThisWeek();
    fetchReminders();
    fetchRandomJob();

    // placeholder recent apps
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
  }, []);

  // ✅ Highlight calendar dates that have reminders
  const tileClassName = ({ date }) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${d}`;
    const hasEvent = events.some((ev) => ev.date === key);
    return hasEvent ? "highlight-date" : "";
  };

  // -------- UI --------
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back,{" "}
          <span className="text-blue-700">
            {student ? `${student.firstName || ""} ${student.lastName || ""}` : "Loading..."}!
          </span>
        </h1>
        <p className="text-gray-600 text-sm mt-1">Here's your internship journey overview</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Application Sent", value: dashboardStats.sent, icon: <Send size={16} className="text-gray-400" />, note: sentWeekNote },
          { label: "Application Accepted", value: dashboardStats.accepted, icon: <CheckCircle2 size={16} className="text-gray-400" />, note: "+1 from last week" },
          { label: "Application Rejected", value: dashboardStats.rejected, icon: <XCircle size={16} className="text-gray-400" />, note: "+5 from this week" },
          { label: "Success Rate", value: `${dashboardStats.successRate}%`, icon: <BarChart3 size={16} className="text-gray-400" />, note: "" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-5 h-36 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 text-sm">{stat.label}</p>
              {stat.icon}
            </div>
            <h2 className="text-3xl font-bold text-[#173B8A]">{stat.value}</h2>
            {stat.label === "Success Rate" ? (
              <div className="w-full bg-gray-200 h-2 rounded-full">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-[#173B8A] to-[#F37526]"
                  style={{ width: `${dashboardStats.successRate}%` }}
                />
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-1">{stat.note}</p>
            )}
          </div>
        ))}
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Applications */}
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Recent Applications</h3>
            <div className="space-y-4">
              {recentApplications.map((app, i) => (
                <div key={i} className="border rounded-lg p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="font-medium text-gray-800">{app.title}</h4>
                    <p className="text-sm text-gray-600">{app.company}</p>
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

          {/* Random Job */}
          {randomJob && (
            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">🔍 Recommended For You</h3>
              <div className="border rounded-lg p-4 flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-800">{randomJob.title}</h4>
                  <p className="text-sm text-gray-600">{randomJob.companyName}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {randomJob.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {randomJob.jobType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {randomJob.description?.slice(0, 100)}...
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {randomJob.skills?.slice(0, 5).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-blue-800 font-bold">{randomJob.salaryMax}</p>
                  <button className="mt-3 bg-orange-500 text-white px-4 py-2 rounded-md text-sm hover:bg-orange-600 transition">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div>
          <div className="bg-white rounded-lg shadow p-5 mb-5">
            <h3 className="text-2xl font-bold text-gray-800 mb-3 mt-2 mb-5">My Schedule</h3>
            <Calendar onChange={setSelectedDate} value={selectedDate} tileClassName={tileClassName} />
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

            {/* Quick Note */}
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
                <p className="text-sm text-gray-500 italic">No reminders added yet.</p>
              ) : (
                events.map((ev, i) => (
                  <div key={i} className="border-l-4 border-blue-600 bg-blue-50 p-2 rounded">
                    <p className="font-medium text-sm text-gray-800">
                      {ev.title} <span className="text-xs text-gray-500">({ev.type})</span>
                    </p>
                    <p className="text-xs text-gray-600">
                      {ev.date} • {ev.time}
                    </p>
                    {ev.description && (
                      <p className="text-xs text-gray-500 mt-1">{ev.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Add Reminder Modal */}
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
