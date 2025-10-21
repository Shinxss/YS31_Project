// src/pages/studentDashboard/StudentDashboardHome.jsx
import React, { useEffect, useMemo, useState } from "react";
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
  Star,
  Pencil,
  Trash2,
} from "lucide-react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import AddReminderModal from "@/components/studentDashboard/AddReminderModal";

const USE_SERVER_STATS = true;

/* ------------------------------- Helpers ------------------------------- */

// Shared normalization so UI + stats agree
const normalizeStatus = (raw = "") => {
  const s = String(raw).toLowerCase().replace(/[_-]+/g, " ").trim();
  if (/^(application\s*sent|submitted|appl(ied|ication)?)$/.test(s)) return "Application Sent";
  if (/^(under review|in review|screening|shortlist(ed)?|processing)$/.test(s)) return "Under Review";
  if (/^(accepted|hired|offer( )?accepted)$/.test(s)) return "Accepted";
  if (/^(rejected|declined|not selected)$/.test(s)) return "Rejected";
  if (/^(withdrawn|canceled|cancelled|pulled back)$/.test(s)) return "Withdrawn";
  return "Application Sent";
};

// "sent" = ALL non-withdrawn submissions (even if Accepted/Rejected later)
function computeDashboardStats(applications = []) {
  let sent = 0;
  let accepted = 0;
  let rejected = 0;

  for (const a of applications) {
    const st = normalizeStatus(a?.status);
    if (st === "Withdrawn") continue;
    sent++;
    if (st === "Accepted") accepted++;
    else if (st === "Rejected") rejected++;
  }

  const decided = accepted + rejected;
  const successRate = decided === 0 ? 0 : Math.round((accepted / decided) * 100);

  return { sent, accepted, rejected, successRate };
}

const peso = (n) => (n == null || isNaN(n) ? "" : `₱${Number(n).toLocaleString()}`);
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

const STATUS_OPTIONS = ["All", "Application Sent", "Under Review", "Accepted", "Rejected"];
const STATUS_STYLES = {
  "Under Review": "bg-yellow-500 text-white",
  "Application Sent": "bg-orange-500 text-white",
  Accepted: "bg-green-500 text-white",
  Rejected: "bg-red-600 text-white",
};

/* -------------------------------- Component ------------------------------- */

export default function StudentDashboardHome({
  student = null,
  dashboardStats = { sent: 0, accepted: 0, rejected: 0, successRate: 0 },
  recentApplications = [],
  recentAppsLoading = false,
  recentAppsError = "",

  // reminders (default everything)
  events = [],
  showModal = false,
  setShowModal = () => {},
  newEvent = { title: "", date: "", time: "", type: "Task", description: "" },
  setNewEvent = () => {},
  quickNote = "",
  setQuickNote = () => {},
  onSaveEvent = () => {},

  // infra used by "Recommended for you"
  API_BASE = "",
  getAuthHeaders = () => ({}),
}) {
  const navigate = useNavigate();

  // always safe arrays
  const safeEvents = Array.isArray(events) ? events : [];
  const safeRecent = Array.isArray(recentApplications) ? recentApplications : [];

  /* ---------- Calendar & Quick note ---------- */
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingIndex, setEditingIndex] = useState(null); // null=create, number=edit

  const tileClassName = ({ date }) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${d}`;
    const hasEvent = safeEvents.some((ev) => ev.date === key);
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
      setEditingIndex(null); // create
      setShowModal(true);
    }
  };

  /* ---------- Dashboard stats (server fetch with client fallback) ---------- */
  const [dashboardStatsLocal, setDashboardStatsLocal] = useState(
    dashboardStats || { sent: 0, accepted: 0, rejected: 0, successRate: 0 }
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchServerStats() {
      if (!USE_SERVER_STATS || !student?._id || !API_BASE) return false;
      try {
        const res = await fetch(`${API_BASE}/api/students/${student._id}/dashboard-stats`, {
          credentials: "include",
          headers: { ...getAuthHeaders() },
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) return false;
        if (!cancelled) setDashboardStatsLocal(data.stats);
        return true;
      } catch {
        return false;
      }
    }

    (async () => {
      const ok = await fetchServerStats();
      if (!ok) {
        const stats = computeDashboardStats(safeRecent);
        if (!cancelled) setDashboardStatsLocal(stats);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [student?._id, API_BASE, getAuthHeaders, safeRecent]);

  // Keep in sync with any new recentApplications
  useEffect(() => {
    setDashboardStatsLocal((prev) => ({
      ...prev,
      ...computeDashboardStats(safeRecent),
    }));
  }, [safeRecent]);

  /* ---------- Recommended for you (1 job) ---------- */
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [recError, setRecError] = useState("");

  const shuffle = (arr) =>
    arr
      .map((x) => ({ x, r: Math.random() }))
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
              const jSkills = (j.skills || []).map((s) => String(s).trim().toLowerCase());
              const score = jSkills.reduce((acc, s) => (mySkills.includes(s) ? acc + 1 : acc), 0);
              return { job: j, score };
            })
          )
            .sort((a, b) => b.score - a.score)
            .map((x) => x.job);
        }

        if (!cancelled) setRecommendedJobs(ranked.slice(0, 1)); // only 1 card
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

  /* ---------- Filters ---------- */
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredRecentApplications = useMemo(() => {
    const withoutWithdrawn = safeRecent.filter(
      (a) => normalizeStatus(a?.status) !== "Withdrawn"
    );
    if (statusFilter === "All") return withoutWithdrawn;
    return withoutWithdrawn.filter((a) => normalizeStatus(a?.status) === statusFilter);
  }, [safeRecent, statusFilter]);

  /* -------------------------------- Render -------------------------------- */

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

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Application Sent", value: dashboardStatsLocal.sent, icon: <Send size={16} className="text-gray-400" /> },
          { label: "Application Accepted", value: dashboardStatsLocal.accepted, icon: <CheckCircle2 size={16} className="text-gray-400" /> },
          { label: "Application Rejected", value: dashboardStatsLocal.rejected, icon: <XCircle size={16} className="text-gray-400" /> },
          { label: "Success Rate", value: `${dashboardStatsLocal.successRate}%`, icon: <BarChart3 size={16} className="text-gray-400" /> },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-5 h-36 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 text-sm">{stat.label}</p>
              {stat.icon}
            </div>
            <h2 className="text-3xl font-bold text-[#173B8A]">{stat.value}</h2>

            {stat.label === "Success Rate" ? (
              // NEW: orange baseline with blue overlay when > 0%
              <div className="relative w-full h-2 rounded-full overflow-hidden bg-gray-200">
                {/* Orange baseline (always visible) */}
                <div className="absolute inset-0 bg-[#F37526]" />
                {/* Blue overlay that blends to transparent; only when > 0 */}
                {Number(dashboardStatsLocal.successRate) > 0 && (
                  <div
                    className="absolute left-0 top-0 h-2"
                    style={{
                      width: `${dashboardStatsLocal.successRate}%`,
                      background:
                        "linear-gradient(to right, #173B8A 0%, rgba(23,59,138,0.85) 65%, rgba(23,59,138,0) 100%)",
                    }}
                  />
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-1"></p>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">📋 Recent Application</h3>
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

            <p className="text-sm text-gray-500 mb-3">Track your latest internship applications</p>

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
            ) : (filteredRecentApplications?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-500">
                {statusFilter === "All"
                  ? "You haven’t applied to any jobs yet."
                  : `No applications with status “${statusFilter}”.`}
              </p>
            ) : (
              <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
                {filteredRecentApplications.map((app, index) => (
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
                    {(() => {
                      const label = normalizeStatus(app?.status);
                      const cls = STATUS_STYLES[label] || "bg-gray-100 text-gray-700";
                      return (
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${cls}`}>
                          {label}
                        </span>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommended for you (1 job) */}
          <div className="bg-white rounded-lg shadow p-5 mt-6 min-h-[220px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-gray-800">Recommended for you</h3>
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
                const rating = job.rating ?? job.companyRating;
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
                const salaryPeriod = job.salaryPeriod || "month";

                return (
                  <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 rounded-2xl border border-blue-100 bg-[#F8FBFF] p-4 md:p-5 shadow-sm hover:shadow transition">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="shrink-0 h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-[#133E87] flex items-center justify-center text-white">
                        <Building2 size={22} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-[#133E87] font-semibold text-base md:text-lg leading-tight">
                            {title}
                          </h4>
                          {typeof rating === "number" && (
                            <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                              <Star size={14} className="text-yellow-400 fill-yellow-400" />
                              {rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{company}</p>
                        {blurb && <p className="mt-1 text-sm text-gray-600 truncate">{blurb}</p>}
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
                            On-site
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

                    <div className="flex flex-col items-end justify-between h-full gap-2 mb-8">
                      <span className="self-end mb-2 text-xs text-white bg-blue-900 border border-blue-100 rounded-full px-3 py-1">
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
            <Calendar onChange={setSelectedDate} value={selectedDate} tileClassName={tileClassName} />
          </div>

          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center justify-between">
              Reminders
              <button
                onClick={() => {
                  setEditingIndex(null); // create mode
                  setShowModal(true);
                }}
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
              {safeEvents.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No reminders added yet.</p>
              ) : (
                safeEvents.map((ev, i) => (
                  <div
                    key={i}
                    className="border-l-4 border-blue-600 bg-blue-50 p-2 rounded flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-800">
                        {ev.title} <span className="text-xs text-gray-500">({ev.type})</span>
                      </p>
                      <p className="text-xs text-gray-600">
                        {ev.date} • {ev.time}
                      </p>
                      {ev.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ev.description}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        title="Edit reminder"
                        aria-label="Edit reminder"
                        onClick={() => {
                          setEditingIndex(i);
                          setNewEvent(ev);
                          setShowModal(true);
                        }}
                        className="p-1 rounded hover:bg-blue-100 text-blue-700"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        title="Delete reminder"
                        aria-label="Delete reminder"
                        onClick={() => {
                          if (confirm("Delete this reminder?")) {
                            onSaveEvent?.({ op: "delete", index: i });
                          }
                        }}
                        className="p-1 rounded hover:bg-red-100 text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
        setShowModal={(v) => {
          if (!v) setEditingIndex(null);
          setShowModal(v);
        }}
        newEvent={newEvent}
        setNewEvent={setNewEvent}
        handleSaveEvent={(maybeEvent) => {
          const eventToSave = maybeEvent || newEvent;
          if (editingIndex === null) {
            onSaveEvent?.({ op: "create", event: eventToSave });
          } else {
            onSaveEvent?.({ op: "update", index: editingIndex, event: eventToSave });
          }
          setEditingIndex(null);
        }}
      />
    </div>
  );
}
