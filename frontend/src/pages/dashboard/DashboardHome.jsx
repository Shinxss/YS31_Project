// src/pages/company/DashboardHome.jsx
import React, { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import { Trash2 } from "lucide-react";
import "../../styles/StudentDashboard.css"; // reuse your react-calendar CSS

const RAW_API_BASE =
  (import.meta.env?.VITE_API_BASE ||
    (typeof window !== "undefined" && /:5173|:5174/.test(window.location.origin)
      ? "http://localhost:5000"
      : "")).trim();

const api = (p) => (RAW_API_BASE ? `${RAW_API_BASE}${p}` : p);

const API = {
  companyApplications: api("/api/company/applications"),
  companyJobs: api("/api/company/jobs"),
  genericJobsActive: api("/api/jobs?active=1"),
  genericJobsAll: api("/api/jobs"),
  studentPublicProfile: (id) => api(`/api/students/${id}/profile`),
};

const timeAgo = (iso) => {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const Initials = ({ name = "" }) => {
  const parts = String(name).trim().split(/\s+/).slice(0, 2);
  const ini = parts.map((p) => p[0]?.toUpperCase() || "").join("");
  return (
    <div className="h-8 w-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
      {ini || "?"}
    </div>
  );
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

export default function DashboardHome() {
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Notes/Tasks (local)
  const [notes, setNotes] = useState(() => {
    try {
      const raw = localStorage.getItem("ic_company_notes");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [newNote, setNewNote] = useState("");

  const authHeader = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("ic_token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    localStorage.setItem("ic_company_notes", JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setErr("");
        setLoading(true);

        const appsRes = await fetch(API.companyApplications, {
          credentials: "include",
          headers: { ...authHeader() },
        });
        if (!appsRes.ok) throw new Error("Failed to load applications");
        const appsJson = await appsRes.json();
        const items = Array.isArray(appsJson)
          ? appsJson
          : Array.isArray(appsJson?.applications)
          ? appsJson.applications
          : appsJson?.items || [];

        let jobsList = [];
        for (const url of [API.companyJobs, API.genericJobsActive, API.genericJobsAll]) {
          try {
            const r = await fetch(url, { credentials: "include", headers: { ...authHeader() } });
            if (r.ok) {
              const j = await r.json();
              jobsList = Array.isArray(j) ? j : j?.items || j?.jobs || [];
              if (jobsList.length) break;
            }
          } catch {}
        }

        if (!cancelled) {
          setApps(items);
          setJobs(jobsList);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalApplications = apps.length;
  const acceptedCount = apps.filter((a) => /accepted/i.test(a.status || "")).length;
  const hireRatePct = totalApplications ? Math.round((acceptedCount / totalApplications) * 100) : 0;

  const activeJobs = useMemo(() => {
    const list = jobs.filter((j) => {
      const s = String(j.status || j.state || (j.isActive ? "active" : "")).toLowerCase();
      return s.includes("active") || s === "open" || j.isActive === true;
    });
    const seen = new Set();
    return list.filter((j) => {
      const id = j._id || j.id || j.slug || j.title;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [jobs]);

  const appsPerJob = useMemo(() => {
    const map = new Map();
    for (const a of apps) {
      const jid = a.job?._id || a.jobId || a.job?.id || "unknown";
      map.set(jid, (map.get(jid) || 0) + 1);
    }
    return map;
  }, [apps]);

  // Trends: last 6 months
  const monthly = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      const label = dt.toLocaleString(undefined, { month: "short" });
      buckets.push({ key, label, count: 0 });
    }
    const keySet = new Set(buckets.map((b) => b.key));
    for (const a of apps) {
      const when = new Date(a.createdAt || a.appliedAt || a.date || Date.now());
      const k = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, "0")}`;
      if (keySet.has(k)) {
        const b = buckets.find((x) => x.key === k);
        if (b) b.count += 1;
      }
    }
    return buckets;
  }, [apps]);

  const latestFive = useMemo(
    () => [...apps].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5),
    [apps]
  );

  const [miniProfiles, setMiniProfiles] = useState({});
  useEffect(() => {
    const ids = Array.from(
      new Set(
        latestFive
          .map((a) => a.student?._id)
          .filter(Boolean)
          .filter((id) => !miniProfiles[id])
      )
    );
    if (!ids.length) return;

    let done = false;
    (async () => {
      try {
        const results = await Promise.all(
          ids.map((id) =>
            fetch(API.studentPublicProfile(id), {
              credentials: "include",
              headers: { ...authHeader() },
            })
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null)
          )
        );
        if (done) return;
        const next = { ...miniProfiles };
        ids.forEach((id, i) => {
          const p = results[i]?.student ? results[i].student : results[i];
          if (p) next[id] = { course: p.course || "", school: p.school || "" };
        });
        setMiniProfiles(next);
      } catch {}
    })();
    return () => {
      done = true;
    };
  }, [latestFive]);

  const LineChart = ({ data }) => {
    const W = 600; // a bit wider viewBox
    const H = 220;
    const PAD = 30;
    const maxY = Math.max(1, ...data.map((d) => d.count));
    const stepX = (W - PAD * 2) / Math.max(1, data.length - 1);

    const pts = data.map((d, i) => {
      const x = PAD + i * stepX;
      const y = H - PAD - (d.count / maxY) * (H - PAD * 2);
      return [x, y];
    });

    const gridY = 4;
    const grid = Array.from({ length: gridY + 1 }, (_, i) => PAD + (i * (H - PAD * 2)) / gridY);

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48">
        {grid.map((y, i) => (
          <line key={i} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#d4d8e3" strokeDasharray="2,4" />
        ))}
        <polyline
          fill="none"
          stroke="#1337B6"
          strokeWidth="3"
          points={pts.map(([x, y]) => `${x},${y}`).join(" ")}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {pts.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="3.5" fill="#1337B6" />
            <text x={x} y={H - 8} textAnchor="middle" fontSize="10" fill="#6b7280">
              {data[i].label}
            </text>
          </g>
        ))}
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#9ca3af" />
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#9ca3af" />
      </svg>
    );
  };

  return (
    <div className="space-y-4 md:space-y-5 bg-[#EAF2FF] min-h-[calc(100vh-60px)] max-w-[1400px] mx-auto px-1.5 md:px-2.5">
      {/* Main + Right rail */}
      <div className="flex flex-col xl:flex-row gap-3.5">
        {/* MAIN COLUMN */}
        <div className="flex-1 min-w-0 flex flex-col gap-3.5">
          {/* KPI row */}
          <div className="flex flex-wrap gap-2.5 md:gap-3.5">
            <div className="flex-1 min-w-[220px]"><KPICard title="Active Job Posts" value={activeJobs.length} /></div>
            <div className="flex-1 min-w-[220px]"><KPICard title="Total Applications" value={totalApplications} /></div>
            <div className="flex-1 min-w-[220px]">
              <KPICard title="Hire Rate" value={`${hireRatePct}%`} sub={`(${acceptedCount}/${totalApplications || 0})`} />
            </div>
          </div>

          {/* Trends + Total mini bar */}
          <div className="flex flex-col lg:flex-row gap-3.5">
            <Card className="flex-[3] min-w-[300px] p-4">
              <h3 className="text-lg font-semibold text-gray-900">Application Trends</h3>
              <p className="text-xs text-gray-500 mb-4">Monthly application volume</p>
              <LineChart data={monthly} />
            </Card>

            <Card className="flex-[1] min-w-[220px] p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Total Application</h3>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden mb-4">
                {(() => {
                  const counts = {
                    total: totalApplications,
                    underReview: apps.filter((a) => /under[_\s]?review/i.test(a.status || "")).length,
                    accepted: acceptedCount,
                    rejected: apps.filter((a) => /rejected/i.test(a.status || "")).length,
                  };
                  const order = ["total", "underReview", "accepted", "rejected"];
                  const sum = order.reduce((acc, k) => acc + counts[k], 0) || 1;
                  const widths = order.map((k) => `${(counts[k] / sum) * 100}%`);
                  const colors = ["#0B2E82", "#f59e0b", "#10b981", "#ef4444"];
                  return (
                    <div className="flex h-full">
                      {order.map((k, i) => (
                        <div key={k} style={{ width: widths[i], background: colors[i] }} />
                      ))}
                    </div>
                  );
                })()}
              </div>
              <ul className="space-y-2 text-xs">
                <LegendItem label="Applications" dot="#0B2E82" value={totalApplications} />
                <LegendItem label="Under Review" dot="#f59e0b" value={apps.filter((a) => /under[_\s]?review/i.test(a.status || "")).length} />
                <LegendItem label="Accepted" dot="#10b981" value={acceptedCount} />
                <LegendItem label="Rejected" dot="#ef4444" value={apps.filter((a) => /rejected/i.test(a.status || "")).length} />
              </ul>
            </Card>
          </div>

          {/* Active jobs + New applications */}
          <div className="flex flex-col lg:flex-row gap-3.5">
            <Card className="flex-[3] min-w-[300px] p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Active Jobs</h3>
              {activeJobs.length === 0 ? (
                <p className="text-sm text-gray-500">No active jobs.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {activeJobs.map((j) => {
                    const id = j._id || j.id || j.slug || j.title;
                    const count = appsPerJob.get(id) || 0;
                    return (
                      <li key={id} className="py-3 flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{j.title || "Untitled"}</p>
                          <p className="text-xs text-gray-500 truncate">{j.location || j.city || j.mode || "—"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Applications</p>
                          <p className="text-base font-semibold">{count}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card className="flex-[1] min-w-[220px] p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">New applications</h3>
              {latestFive.length === 0 ? (
                <p className="text-sm text-gray-500">No recent applications.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {latestFive.map((a) => {
                    const student = a.student || {};
                    const name =
                      student.fullName ||
                      [student.firstName, student.lastName].filter(Boolean).join(" ") ||
                      "Unknown Applicant";
                    const sub =
                      (student._id &&
                        ((miniProfiles[student._id] || {}).course ||
                          (miniProfiles[student._id] || {}).school)) ||
                      "—";
                    return (
                      <li key={a._id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <Initials name={name} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                            <p className="text-xs text-gray-500 truncate">{sub}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Applied</p>
                          <p className="text-xs font-medium text-gray-700">
                            {timeAgo(a.appliedAt || a.createdAt)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>

          {err && (
            <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
              {err}
            </div>
          )}
        </div>

        {/* RIGHT RAIL (calendar/tasks) */}
        <div className="xl:w-[380px] shrink-0 flex flex-col gap-3.5">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Calendar</h3>
            <CalendarPanel />
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Tasks</h3>
            <Tasks notes={notes} setNotes={setNotes} newNote={newNote} setNewNote={setNewNote} />
          </Card>

          {/* Optional placeholders to match your mock */}
          <Card className="p-4"><div className="h-24" /></Card>
          <Card className="p-4"><div className="h-24" /></Card>
        </div>
      </div>

      {loading && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-white border shadow px-3 py-2 text-sm">
          Loading…
        </div>
      )}
    </div>
  );
}

function KPICard({ title, value, sub }) {
  return (
    <Card className="p-3 group">
      <div className="flex items-start justify-between">
        <p className="text-sm text-gray-700">{title}</p>
        <Trash2 className="h-4 w-4 text-gray-300" />
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <p className="text-2xl font-bold text-[#0B2E82]">{value}</p>
        {sub ? <span className="text-xs text-gray-500">{sub}</span> : null}
      </div>
    </Card>
  );
}

function LegendItem({ label, dot, value }) {
  return (
    <li className="flex items-center justify-between">
      <span className="inline-flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
        {label}
      </span>
      <span className="text-gray-700 font-medium text-[10px]">{value}</span>
    </li>
  );
}

function CalendarPanel() {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const iso =
    calendarDate instanceof Date && !isNaN(calendarDate)
      ? calendarDate.toISOString().slice(0, 10)
      : "—";

  return (
    <>
      <Calendar
        onChange={setCalendarDate}
        value={calendarDate}
        className="react-calendar"
        tileClassName={({ date }) =>
          date.toDateString() === calendarDate.toDateString() ? "highlight-date" : undefined
        }
      />
      <p className="text-xs text-gray-500 mt-3">Selected: {iso}</p>
    </>
  );
}

function Tasks({ notes, setNotes, newNote, setNewNote }) {
  return (
    <>
      <div className="flex gap-2 mb-3">
        <input
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
        />
        <button
          onClick={() => {
            if (!newNote.trim()) return;
            setNotes((prev) => [
              ...prev,
              { id: crypto.randomUUID(), text: newNote.trim(), done: false },
            ]);
            setNewNote("");
          }}
          className="px-3 py-2 rounded-lg bg-[#1337B6] text-white"
        >
          Add
        </button>
      </div>

      <ul className="space-y-2">
        {notes.length === 0 ? (
          <li className="text-xs text-gray-500">No tasks yet.</li>
        ) : (
          notes.map((n) => (
            <li key={n.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={n.done}
                  onChange={(e) =>
                    setNotes((prev) =>
                      prev.map((x) => (x.id === n.id ? { ...x, done: e.target.checked } : x))
                    )
                  }
                />
                <span className={n.done ? "line-through text-gray-400" : ""}>{n.text}</span>
              </label>
              <button
                onClick={() => setNotes((prev) => prev.filter((x) => x.id !== n.id))}
                className="text-xs text-red-600 hover:underline"
              >
                remove
              </button>
            </li>
          ))
        )}
      </ul>
    </>
  );
}
