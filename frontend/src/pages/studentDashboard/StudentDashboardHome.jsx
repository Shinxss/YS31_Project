// src/pages/studentDashboard/StudentDashboardHome.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  BarChart3,
  Plus,
} from "lucide-react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import AddReminderModal from "@/components/studentDashboard/AddReminderModal";

export default function StudentDashboardHome({
  student,
  dashboardStats,
  recentApplications,
  recentAppsLoading,
  recentAppsError,

  // reminders
  events,
  showModal,
  setShowModal,
  newEvent,
  setNewEvent,
  quickNote,
  setQuickNote,
  onSaveEvent,

  // infra used by "Recommended for you"
  API_BASE,
  getAuthHeaders,
}) {
  const navigate = useNavigate();

  /* ---------- Calendar & Quick note ---------- */
  const [selectedDate, setSelectedDate] = useState(new Date());
  const tileClassName = ({ date }) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${d}`;
    const hasEvent = events.some((ev) => ev.date === key);
    return hasEvent ? "highlight-date" : "";
  };
  const handleQuickNoteKeyDown = (e) => {
    if (e.key === "Enter" && quickNote.trim()) {
      setNewEvent((prev) => ({
        ...prev,
        title: quickNote.trim(),
        date: selectedDate.toISOString().split("T")[0],
        time: prev.time || "00:00",
      }));
      setQuickNote("");
      setShowModal(true);
    }
  };

  /* ---------- Recommended for you (1 job) ---------- */
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [recError, setRecError] = useState("");

  const shuffle = (arr) =>
    arr.map((x) => ({ x, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .map(({ x }) => x);

  const getStudentSkills = (stu) => {
    if (!stu) return [];
    const pools = [
      stu.skills,
      stu.profile?.skills,
      stu.techSkills,
      stu.technicalSkills,
      stu?.resume?.skills,
    ].filter(Boolean);
    const out = [];
    for (const p of pools) {
      if (Array.isArray(p)) out.push(...p);
      else if (typeof p === "string") out.push(...p.split(","));
    }
    return [...new Set(out.map((s) => String(s).trim().toLowerCase()).filter(Boolean))];
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setRecLoading(true);
        setRecError("");

        const res = await fetch(`${API_BASE}/api/jobs`, {
          credentials: "include",
          headers: { ...getAuthHeaders() },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load jobs");

        const jobs = Array.isArray(data.jobs) ? data.jobs : [];
        const mySkills = getStudentSkills(student);

        let ranked;
        if (mySkills.length === 0) {
          ranked = shuffle(jobs);
        } else {
          ranked = shuffle(
            jobs.map((j) => {
              const jSkills = (j.skills || []).map((s) =>
                String(s).trim().toLowerCase()
              );
              const score = jSkills.reduce(
                (acc, s) => (mySkills.includes(s) ? acc + 1 : acc),
                0
              );
              return { job: j, score };
            })
          )
            .sort((a, b) => b.score - a.score)
            .map((x) => x.job);
        }

        if (!cancelled) setRecommendedJobs(ranked.slice(0, 1)); // <= ONLY 1
      } catch (e) {
        if (!cancelled) {
          setRecError(e.message || "Failed to load recommendations");
          setRecommendedJobs([]);
        }
      } finally {
        if (!cancelled) setRecLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [API_BASE, getAuthHeaders, student]);

  return (
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

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT SIDE */}
        <div className="lg:col-span-2">
          {/* Recent Application */}
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📋 Recent Application
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Track your latest internship applications
            </p>

            {recentAppsLoading ? (
              <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="border rounded-lg p-4 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : recentAppsError ? (
              <p className="text-sm text-red-600">{recentAppsError}</p>
            ) : recentApplications.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                You haven’t applied to any jobs yet.
              </p>
            ) : (
              // ⬇️ Only ~3 items visible; scroll for more
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {recentApplications.map((app, index) => (
                  <div
                    key={`${app.title}-${index}`}
                    className="border rounded-lg p-4 flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <h4 className="font-medium text-gray-800">
                        {app.title}
                      </h4>
                      <p className="text-sm text-gray-600">{app.company}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <MapPin size={12} /> {app.location}
                        <Clock size={12} /> {app.date}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        /accept/i.test(app.status)
                          ? "bg-green-100 text-green-700"
                          : /reject/i.test(app.status)
                          ? "bg-red-100 text-red-600"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommended for you (1 job) */}
          <div className="bg-white rounded-lg shadow p-5 mt-6 min-h-[220px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800">
                ✨ Recommended for you
              </h3>
            </div>
        
            {recLoading ? (
              <div className="border rounded-lg p-4 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ) : recError ? (
              <p className="text-sm text-red-600">{recError}</p>
            ) : recommendedJobs.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No recommendations yet.
              </p>
            ) : (
              (() => {
                const job = recommendedJobs[0];
                return (
                  <div className="border rounded-lg p-4 flex items-start justify-between">
                    <div className="pr-4">
                      <h4 className="font-medium text-gray-900">
                        {job.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {job.companyName}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-gray-400" />
                          {job.location || "—"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-gray-400" />
                          {(job.months ?? job.durationMonths)
                            ? `${job.months ?? job.durationMonths} months · `
                            : ""}
                          {job.jobType || job.workType || "—"}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            className="text-gray-400"
                          >
                            <path
                              fill="currentColor"
                              d="M3 5h18v2H3zm0 6h18v2H3zm0 6h18v2H3z"
                            />
                          </svg>
                          {job.department || "—"}
                        </span>
                      </div>

                      {Array.isArray(job.skills) && job.skills.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {job.skills.slice(0, 5).map((s, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2 py-1 rounded-full border border-gray-300 text-gray-700"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => navigate(`/jobs/${job._id}`)}
                      className="text-sm bg-[#F37526] hover:bg-orange-600 text-white px-3 py-2 rounded-md"
                    >
                      View Details
                    </button>
                  </div>
                );
              })()
            )}
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

      {/* Reminder modal */}
      <AddReminderModal
        showModal={showModal}
        setShowModal={setShowModal}
        newEvent={newEvent}
        setNewEvent={setNewEvent}
        handleSaveEvent={onSaveEvent}
      />
    </div>
  );
}
