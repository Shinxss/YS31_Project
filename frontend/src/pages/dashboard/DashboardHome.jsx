// src/pages/company/DashboardHome.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import { Trash2, TrendingUp, TrendingDown, Minus, Briefcase, ClipboardList } from "lucide-react";
import "../../styles/StudentDashboard.css";

/* -------------------------------------------------------
   API base resolver
------------------------------------------------------- */
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

/* -------------------------------------------------------
   Layout constants (heights to keep bottoms aligned)
------------------------------------------------------- */
const LIST_H = 230;       // height for each right-rail card (New Apps, Tasks)
const GAP_PX = 16;        // gap-4 between the two right cards
const COMBINED_H = LIST_H * 2 + GAP_PX; // left big card height (chart + job list)

/* -------------------------------------------------------
   Small helpers
------------------------------------------------------- */
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
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

/* Avatar that prefers an actual image but falls back to initials */
const Avatar = ({ name = "", src = "" }) => {
  const parts = String(name).trim().split(/\s+/).slice(0, 2);
  const ini = parts.map((p) => p[0]?.toUpperCase() || "").join("");
  if (src) {
    return (
      <img
        src={src}
        alt={name || "avatar"}
        className="h-8 w-8 rounded-full object-cover border border-gray-200"
      />
    );
  }
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

/* -------------------------------------------------------
   Page
------------------------------------------------------- */
export default function DashboardHome() {
    const [apps, setApps] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const navigate = useNavigate();
    const goToApplications = () => {
      // adjust the path if your route differs
      navigate("/company/applications");
      // optional: ensure the list starts at the top
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
    };

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

  /* Prefer company token on company pages */
  const authHeader = () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("ic_company_token") || localStorage.getItem("ic_token")
        : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    localStorage.setItem("ic_company_notes", JSON.stringify(notes));
  }, [notes]);

  /* ---------- helpers for loading ---------- */
  const getCompanyId = () => {
    try {
      const fromLS = JSON.parse(localStorage.getItem("ic_company") || "null");
      if (fromLS?._id) return fromLS._id;

      const token = localStorage.getItem("ic_company_token") || localStorage.getItem("ic_token") || "";
      const mid = token.split(".")[1];
      if (mid) {
        const claim = JSON.parse(atob(mid));
        if (claim?.companyId) return claim.companyId;
      }
    } catch {}
    return null;
  };

  const asArray = (j) =>
    Array.isArray(j) ? j :
    Array.isArray(j?.applications) ? j.applications :
    Array.isArray(j?.items) ? j.items :
    Array.isArray(j?.jobs) ? j.jobs :
    Array.isArray(j?.data) ? j.data :
    Array.isArray(j?.result) ? j.result :
    Array.isArray(j?.result?.items) ? j.result.items :
    [];

  /* ---------- load apps + jobs ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setErr("");
        setLoading(true);

        // Applications
        const appsRes = await fetch(API.companyApplications, {
          credentials: "include",
          headers: { ...authHeader() },
        });
        if (!appsRes.ok) throw new Error("Failed to load applications");
        const appsJson = await appsRes.json();
        const appsList = asArray(appsJson);
        if (!cancelled) setApps(appsList);

        // companyId
        const cid =
          getCompanyId() ||
          appsList.find((a) => a?.companyId?._id)?.companyId?._id ||
          appsList.find((a) => a?.companyId)?.companyId ||
          null;

        // Jobs
        const urls = [
          API.companyJobs,
          cid ? `${API.genericJobsAll}?companyId=${cid}` : null,
          cid ? `${API.genericJobsActive}&companyId=${cid}` : null,
          API.genericJobsAll,
          API.genericJobsActive,
        ].filter(Boolean);

        let jobsList = [];
        for (const url of urls) {
          try {
            const r = await fetch(url, { credentials: "include", headers: { ...authHeader() } });
            if (!r.ok) continue;
            const j = await r.json();
            const arr = asArray(j);
            if (arr.length) {
              jobsList = arr;
              break;
            }
          } catch {}
        }

        if (cid) {
          jobsList = jobsList.filter((j) => {
            const a = j.companyId && (j.companyId._id || j.companyId);
            return String(a || "") === String(cid);
          });
        }

        if (!cancelled) setJobs(jobsList);
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

  /* ---------- computed values ---------- */
  const totalApplications = apps.length;
  const underReviewCount = apps.filter((a) => /under[_\s]?review/i.test(a.status || "")).length;
  const acceptedCount = apps.filter((a) => /accepted/i.test(a.status || "")).length;
  const rejectedCount = apps.filter((a) => /rejected/i.test(a.status || "")).length;

  const hireRatePct = pct(acceptedCount, totalApplications);

  // Active jobs filter
  const activeJobs = useMemo(() => {
    const now = Date.now();
    const seen = new Set();
    return (jobs || []).filter((j) => {
      const status = String(j.status || j.state || (j.isActive ? "active" : "")).toLowerCase();
      const isActive =
        status === "open" ||
        status === "active" ||
        status.includes("open") ||
        status.includes("active") ||
        j.isActive === true;

      const notArchived = !(j.isArchived || j.archived);
      const notClosed = !/closed|inactive|archived/i.test(String(j.state || j.status || "")); 
      const notExpired =
        !j.applicationDeadline || new Date(j.applicationDeadline).getTime() >= now;

      const id = j._id || j.id || j.slug || j.title;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return isActive && notArchived && notClosed && notExpired;
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

  // Job trend: last 30d vs previous 30d (for the blue icon)
  const jobTrends = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const lastStart = now - 30 * day;
    const prevStart = now - 60 * day;

    const cur = new Map();
    const prev = new Map();

    for (const a of apps) {
      const jid = a.job?._id || a.jobId || a.job?.id || "unknown";
      const ts = new Date(a.createdAt || a.appliedAt || Date.now()).getTime();
      if (ts >= lastStart) cur.set(jid, (cur.get(jid) || 0) + 1);
      else if (ts >= prevStart && ts < lastStart) prev.set(jid, (prev.get(jid) || 0) + 1);
    }

    const out = new Map();
    const ids = new Set([...cur.keys(), ...prev.keys()]);
    ids.forEach((id) => {
      const a = cur.get(id) || 0;
      const b = prev.get(id) || 0;
      const change = a - b;
      out.set(id, { dir: change > 0 ? "up" : change < 0 ? "down" : "flat" });
    });
    return out;
  }, [apps]);

  // Monthly grouped bars: Accepted vs Rejected (12 months)
  const monthlyBars = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = 11; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      buckets.push({ key, label: dt.toLocaleString(undefined, { month: "short" }), accepted: 0, rejected: 0 });
    }
    const idx = new Map(buckets.map((b, i) => [b.key, i]));
    for (const a of apps) {
      const when = new Date(a.createdAt || a.appliedAt || a.date || Date.now());
      const k = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, "0")}`;
      const i = idx.get(k);
      if (i == null) continue;
      if (/accepted/i.test(a.status || "")) buckets[i].accepted += 1;
      else if (/rejected/i.test(a.status || "")) buckets[i].rejected += 1;
    }
    return buckets;
  }, [apps]);

  const latestFive = useMemo(
    () => [...apps].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5),
    [apps]
  );

  /* Mini profile cache: also store profilePicture for avatars */
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
          if (p) {
            next[id] = {
              course: p.course || "",
              school: p.school || "",
              profilePicture: p.profilePicture || "",
            };
          }
        });
        setMiniProfiles(next);
      } catch {}
    })();
    return () => {
      done = true;
    };
  }, [latestFive]);

  /* ---------- grouped BAR chart (RAW COUNTS, nice auto ticks) ---------- */
  function GroupedBarChart({ data }) {
    // Layout
    const W = 640;
    const PADL = 56; // room for y-axis labels
    const PADR = 24;
    const PADT = 24;
    const PADB = 28;
    const H = 260;
    const innerW = W - PADL - PADR;
    const innerH = H - PADT - PADB;

    // Max raw count across months
    const dataMax = Math.max(
      1,
      ...data.map((d) => Math.max(d.accepted || 0, d.rejected || 0))
    );

    // Choose a "nice" tick step (1/2/5 × 10^n) targeting ~5 ticks
    const targetTicks = 5;
    const roughStep = dataMax / targetTicks;
    const pow10 = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const r = roughStep / pow10;
    let step;
    if (r <= 1) step = 1 * pow10;
    else if (r <= 2) step = 2 * pow10;
    else if (r <= 5) step = 5 * pow10;
    else step = 10 * pow10;

    const yMax = Math.max(step, Math.ceil(dataMax / step) * step);
    const ticks = Array.from({ length: Math.floor(yMax / step) + 1 }, (_, i) => i * step);

    const stepX = innerW / data.length;
    const barW = stepX * 0.32;
    const yOf = (val) => PADT + innerH - (val / yMax) * innerH;

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[260px]">
        {/* grid + y-axis labels */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PADL} y1={yOf(t)} x2={W - PADR} y2={yOf(t)} stroke="#E8ECF6" />
            <text x={PADL - 8} y={yOf(t) + 3} textAnchor="end" fontSize="10" fill="#6b7280">
              {t}
            </text>
          </g>
        ))}

        {/* bars (raw counts) */}
        {data.map((d, i) => {
          const baseX = PADL + i * stepX;
          const acc = d.accepted || 0;
          const rej = d.rejected || 0;

          const hA = (acc / yMax) * innerH;
          const hR = (rej / yMax) * innerH;

          const xA = baseX + stepX / 2 - barW - 3;
          const xR = baseX + stepX / 2 + 3;

          const yA = PADT + innerH - hA;
          const yR = PADT + innerH - hR;

          return (
            <g key={d.key}>
              <rect x={xA} y={yA} width={barW} height={hA} rx="4" fill="#10b981" />
              <rect x={xR} y={yR} width={barW} height={hR} rx="4" fill="#ef4444" />
              <text
                x={baseX + stepX / 2}
                y={H - 8}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {d.label}
              </text>
            </g>
          );
        })}

        {/* axes */}
        <line x1={PADL} y1={PADT} x2={PADL} y2={PADT + innerH} stroke="#CBD5E1" />
        <line x1={PADL} y1={PADT + innerH} x2={W - PADR} y2={PADT + innerH} stroke="#CBD5E1" />
      </svg>
    );
  }

  const totalPctRow = [
    { label: "Applications", value: totalApplications, color: "#6D61F6" },
    { label: "Under Review", value: underReviewCount, color: "#F59E0B" },
    { label: "Accepted", value: acceptedCount, color: "#10B981" },
    { label: "Rejected", value: rejectedCount, color: "#EF4444" },
  ];
  const totalSum = totalPctRow.reduce((a, b) => a + b.value, 0) || 1;

  const softBg = (hex, alpha = 0.15) => {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

  /* ---------- UI ---------- */
  return (
    <div className="bg-[#F5F7FD] min-h-[calc(100vh-60px)] max-w-[1400px] mx-auto space-y-4">
      <div className="flex gap-4 items-start">
        {/* LEFT STACK */}
        <div className="flex-1 min-w-[820px] flex flex-col gap-4">
          {/* STATS ROW */}
          <div className="flex gap-4 flex-wrap">
            <div className="basis-[32%] shrink-0">
              <KPICard 
              title="Active Job Posts" 
              value={activeJobs.length} 
              Icon={Briefcase}/>
            </div>
            <div className="basis-[32%] shrink-0">
              <KPICard 
              title="Total Applications" 
              value={totalApplications} 
              sub={`${pct(totalApplications, totalSum)}%`}
              Icon={ClipboardList} />
            </div>
            <div className="basis-[32%] shrink-0">
              <KPICard 
              title="Hire Rate" 
              value={`${hireRatePct}%`} 
              sub={`(${acceptedCount}/${totalApplications || 0})`}
              Icon={TrendingUp} />
            </div>
          </div>

          {/* MAIN ROW */}
          <div className="flex gap-4 items-start">
            {/* LEFT COLUMN: Combined card (chart + job list) */}
            <Card className={`p-4 h-[${COMBINED_H}px] flex flex-col basis-[65%] shrink-0`}>
              {/* Application Trends header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Application Trends</h3>
                <button
                  onClick={goToApplications}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-[#F37526] text-white shadow-sm"
                >
                  View List
                </button>
              </div>

              {/* Legend */}
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: "#10b981" }} /> Accepted
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: "#ef4444" }} /> Rejected
                </span>
              </div>

              {/* Chart */}
              <div className="mt-2">
                <GroupedBarChart data={monthlyBars} />
              </div>

              {/* Job list header */}
              <div className="mt-4 flex font-bold items-center pl-2 py-2 text-sm text-gray-500 bg-white border-b-1 border-gray-200">
                <div className="flex-1">Job title</div>
                <div className="w-15 text-right pr-3">Applications</div>
                <div className="w-10" />
              </div>

              {/* Job list: scrollable, show 4 rows max */}
              <div className="mt-2 flex-1 overflow-hidden">
                {/* Height ~4 rows; tweak if your row height differs */}
                <ul className="divide-y divide-gray-200 overflow-y-auto h-[228px]">
                  {activeJobs.length === 0 ? (
                    <li className="px-4 py-3 text-sm text-gray-500">No active jobs.</li>
                  ) : (
                    activeJobs.map((j) => {
                      const id = j._id || j.id || j.slug || j.title;
                      const count = appsPerJob.get(id) || 0;
                      const t = jobTrends.get(id) || { dir: "flat" };
                      return (
                        <li
                          key={id}
                          className="flex items-center px-4 py-3 hover:bg-gray-50 transition"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{j.title || "Untitled"}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {j.location || j.city || j.mode || "—"}
                            </p>
                          </div>
                          <div className="w-32 text-sm font-semibold text-gray-900 text-right pr-3">
                            {count}
                          </div>
                          <div className="w-10 flex justify-end">
                            <TrendBadge dir={t.dir} />
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            </Card>

            {/* RIGHT COLUMN (same total height as left) */}
            <div className={`basis-[33%] shrink-0 flex flex-col gap-4 h-[${COMBINED_H}px] min-h-0`}>
              <Card className={`p-4 h-[${LIST_H}px] flex flex-col min-h-0`}>
                <h3 className="text-sm font-semibold text-gray-900">Total Applications</h3>
                <div className="mt-3 h-2 w-full rounded-full bg-[#EEF1FF] overflow-hidden">
                  <div className="flex h-full">
                    {[
                      { label: "Applications", value: totalApplications, color: "#6D61F6" },
                      { label: "Under Review", value: underReviewCount, color: "#F59E0B" },
                      { label: "Accepted", value: acceptedCount, color: "#10B981" },
                      { label: "Rejected", value: rejectedCount, color: "#EF4444" },
                    ].map((r) => (
                      <div key={r.label} style={{ width: `${(r.value / (totalApplications + underReviewCount + acceptedCount + rejectedCount || 1)) * 100}%`, background: r.color }} />
                    ))}
                  </div>
                </div>
                <ul className="mt-4 text-sm overflow-y-auto flex-1 min-h-0 pr-1">
                  {[
                    { label: "Applications", value: totalApplications, color: "#6D61F6" },
                    { label: "Under Review", value: underReviewCount, color: "#F59E0B" },
                    { label: "Accepted", value: acceptedCount, color: "#10B981" },
                    { label: "Rejected", value: rejectedCount, color: "#EF4444" },
                  ].map((r, i, arr) => {
                    const sum = totalApplications + underReviewCount + acceptedCount + rejectedCount || 1;
                    return (
                      <li key={r.label}>
                        <div className="flex items-center justify-between py-2">
                          <span className="inline-flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                            <span className="text-gray-700">{r.label}</span>
                          </span>
                          <span className="inline-flex items-center">
                            <span className="mr-2 text-gray-600">{r.value}</span>
                            <span
                              className="px-2 py-0.5 rounded-full text-[11px]"
                              style={{
                                color: r.color,
                                backgroundColor: softBg(r.color, 0.18), // Background for pill
                                borderColor: r.color, // Border color matches the label
                                borderWidth: '1px', // Optional: Border around the pill for better visibility
                              }}
                            >
                              {pct(r.value, sum)}%
                            </span>
                          </span>
                        </div>
                        <div className={`h-px bg-gray-200 ${i === arr.length - 1 ? "hidden" : ""}`} />
                      </li>
                    );
                  })}
                </ul>
              </Card>

              <Card className="p-4 h-[386px] flex flex-col min-h-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">New Applications</h3>
                </div>

                {/* header underline */}
                <div className="mt-2 border-b border-gray-200" />

                {/* scrollable list: ~4 rows visible */}
                <div className="mt-2 flex-1 overflow-hidden">
                  <ul className="divide-y divide-gray-200 overflow-y-auto h-[360px] pr-1">
                    {latestFive.length === 0 ? (
                      <li className="py-3 text-sm text-gray-500">No recent applications.</li>
                    ) : (
                      latestFive.map((a) => {
                        const student = a.student || {};
                        const name =
                          student.fullName ||
                          [student.firstName, student.lastName].filter(Boolean).join(" ") ||
                          "Unknown Applicant";

                        // Find the job title robustly
                        const jobTitle =
                          a.job?.title ||
                          a.jobTitle ||
                          (a.job && a.job.name) ||
                          (a.jobId &&
                            (jobs.find((j) => String(j._id || j.id) === String(a.jobId))?.title)) ||
                          "a job";

                        const sub = `Applied for ${jobTitle}`;

                        const avatarUrl =
                          student.profilePicture ||
                          (student._id ? miniProfiles[student._id]?.profilePicture : "");

                        return (
                          <li key={a._id || `${name}-${a.createdAt || Math.random()}`} className="py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar name={name} src={avatarUrl} />
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
                      })
                    )}
                  </ul>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* RIGHT RAIL: Calendar & Tasks */}
        <div className="w-[310px] shrink-0 self-start flex flex-col gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-900">Calendar</h3>
            <CalendarPanel />
          </Card>
          <Card className={`p-4 h-[${LIST_H}px] flex flex-col`}>
            <h3 className="text-sm font-semibold text-gray-900">Tasks</h3>
            <Tasks notes={notes} setNotes={setNotes} newNote={newNote} setNewNote={setNewNote} />
          </Card>
        </div>
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
          {err}
        </div>
      )}
      {loading && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-white border shadow px-3 py-2 text-sm">
          Loading…
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   Tiny components
------------------------------------------------------- */
function KPICard({ title, value, sub, Icon = Briefcase }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <p className="text-sm text-gray-600">{title}</p>
        <Icon className="h-4 w-4  text-gray-600" />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-bold text-[#0B63F8]">{value}</p>
        {sub ? <span className="text-xs text-gray-500">{sub}</span> : null}
      </div>
    </Card>
  );
}

function TrendBadge({ dir }) {
  const base =
    "inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#E8F0FF] text-[#0B63F8] border border-[#CFE0FF]";
  if (dir === "up")
    return (
      <span className={base} title="Increasing (last 30d)">
        <TrendingUp className="h-4 w-4" />
      </span>
    );
  if (dir === "down")
    return (
      <span className={base} title="Decreasing (last 30d)">
        <TrendingDown className="h-4 w-4" />
      </span>
    );
  return (
    <span className={base} title="No change">
      <Minus className="h-4 w-4" />
    </span>
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
          className="px-3 py-2 rounded-lg bg-[#0B63F8] text-white"
        >
          Add
        </button>
      </div>

      {/* Scrollable list area */}
      <div className="flex-1 overflow-y-auto min-h-0">
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
      </div>
    </>
  );
}
