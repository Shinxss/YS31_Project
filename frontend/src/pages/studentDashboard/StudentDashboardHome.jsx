// src/pages/studentDashboard/StudentDashboardHome.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  BarChart3,
  Plus,
  Building2,
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

  const peso = (n) =>
  n == null || isNaN(n) ? "" : `₱${Number(n).toLocaleString()}`;

  const formatTimeAgo = (dateLike) => {
    const d = dateLike ? new Date(dateLike) : new Date();
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    const mins = Math.floor(s / 60);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
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

  const STATUS_OPTIONS = ["All", "Application sent", "Under Review", "Accepted", "Rejected"];
  const [statusFilter, setStatusFilter] = useState("All");

  // Normalize backend variants into the 4 labels above
  const normalizeStatus = (raw = "") => {
    const s = String(raw).toLowerCase().replace(/[_-]+/g, " ").trim();
    if (/^(application\s*sent|submitted|applied?)$/.test(s)) return "Application sent";
    if (/^(under review|in review|screening|shortlisted?)$/.test(s)) return "Under Review";
    if (/^(accepted|hired|offer accepted?)$/.test(s)) return "Accepted";
    if (/^(rejected|declined|not selected?)$/.test(s)) return "Rejected";
    return raw || "Application sent";
  };

  // Memoized filtered list used by the UI
  const filteredRecentApplications = useMemo(() => {
    const list = Array.isArray(recentApplications) ? recentApplications : [];
    if (statusFilter === "All") return list;
    return list.filter((a) => normalizeStatus(a?.status) === statusFilter);
  }, [recentApplications, statusFilter]);     

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


      {/* GRID WRAPPER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT SIDE */}
        <div className="lg:col-span-2">
          {/* Recent Application */}
          <div className="bg-white rounded-lg shadow p-5 flex flex-col min-h-[490px]">
            {/* header + filter */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">📋 Recent Application</h3>

              {/* Status filter */}
              <div className="flex items-center gap-2">
                <label htmlFor="recent-status-filter" className="sr-only">
                  Filter by status
                </label>
                <select
                  id="recent-status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-md border px-2 py-1 text-sm text-gray-700"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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
            ) : (recentApplications?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-500">
                You haven’t applied to any jobs yet.
              </p>
            ) : (
              <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
                {filteredRecentApplications.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No applications with status “{statusFilter}”.
                  </p>
                ) : (
                  filteredRecentApplications.map((app, index) => (
                    <div
                      key={`${app.title}-${index}`}
                      className="border rounded-lg p-4 flex items-center justify-between shadow-sm"
                    >
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
                  ))
                )}
              </div>
            )}
          </div>

          {/* Recommended for you (1 job) */}
          <div className="bg-white rounded-lg shadow p-5 mt-6 min-h-[220px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800">✨ Recommended for you</h3>
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
              <p className="text-sm text-gray-500">No recommendations yet.</p>
            ) : (
              (() => {
                const job = recommendedJobs[0];

                const title = job.title || "—";
                const company = job.companyName || job.company || "—";
                const rating = job.rating ?? job.companyRating; // expect a number like 4.8
                const blurb =
                  job.shortDescription ||
                  job.summary ||
                  (job.description ? String(job.description).replace(/\s+/g, " ").trim() : "");
                const loc = job.location || "—";
                const workType = job.jobType || job.workType || "—";
                const dept = job.department || job.industry || "—";
                const tag =
                  (Array.isArray(job.tags) && job.tags[0]) ||
                  (Array.isArray(job.skills) && job.skills[0]) ||
                  "";
                const salaryNum = job.salary ?? job.salaryMin ?? job.stipend;
                const salaryPeriod = job.salaryPeriod || "month"; // “month” to match the mock

                return (
                  <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 rounded-2xl border border-blue-100 bg-[#F8FBFF] p-4 md:p-5 shadow-sm hover:shadow transition">
                    {/* left: logo box + details */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="shrink-0 h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-[#133E87] flex items-center justify-center text-white">
                        <Building2 size={22} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-[#133E87] font-semibold text-base md:text-lg leading-tight">
                            {title}
                          </h4>
                          {/* rating */}
                          {typeof rating === "number" && (
                            <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                              <Star size={14} className="text-yellow-400 fill-yellow-400" />
                              {rating.toFixed(1)}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-700">{company}</p>

                        {blurb && (
                          <p className="mt-1 text-sm text-gray-600 truncate">
                            {blurb}
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={14} className="text-gray-400" />
                            {loc}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock size={14} className="text-gray-400" />
                            {workType}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={14} className="text-gray-400" />
                            On-site{/* matches screenshot; replace with job.workArrangement if you have it */}
                          </span>
                          <span className="inline-flex items-center gap-1">
                          <Building2 size={14} className="text-gray-400" />
                            {dept}
                          </span>
                        </div>

                        {tag && (
                          <div className="mt-3">
                            <span className="inline-block text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                              {tag}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* right: time, salary, button */}
                    <div className="flex flex-col items-end justify-between h-full gap-2 mb-8">
                      <span className="self-end mb-2 text-xs text-gray-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
                        {formatTimeAgo(job.createdAt || job.postedAt)}
                      </span>

                      <div className="mt-auto flex flex-col items-end gap-3">
                        <div className="text-[#133E87] font-bold text-lg md:text-xl">
                          {salaryNum ? `${peso(salaryNum)}/${salaryPeriod}` : ""}
                        </div>

                        <button
                          onClick={() => navigate(`/jobs/${job._id}`)}
                          className="text-sm bg-[#F37526] hover:bg-orange-600 text-white px-4 py-2 rounded-md"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div>
          <div className="bg-white rounded-lg shadow p-5 mb-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">My Schedule</h3>
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
                    {ev.description && <p className="text-xs text-gray-500 mt-1">{ev.description}</p>}
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
