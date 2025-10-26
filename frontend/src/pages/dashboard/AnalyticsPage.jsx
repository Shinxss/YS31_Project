// src/pages/company/CompanyAnalytics.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { ClipboardList, PieChart as PieIcon, TrendingUp } from "lucide-react";

/* -------------------------------------------------------
   API base resolver (same method as other pages)
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
};

/* -------------------------------------------------------
   Small helpers
------------------------------------------------------- */
const authHeader = () => {
  const token =
    (typeof window !== "undefined" && localStorage.getItem("ic_company_token")) ||
    (typeof window !== "undefined" && localStorage.getItem("ic_token")) ||
    null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/* build last 12 months labels */
const last12Months = () => {
  const now = new Date();
  const out = [];
  for (let i = 11; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: monthKey(dt), label: dt.toLocaleString(undefined, { month: "short" }) });
  }
  return out;
};

const COLORS = ["#6D61F6", "#0B63F8", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

/* -------------------------------------------------------
   Component
------------------------------------------------------- */
export default function CompanyAnalytics() {
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const [aRes, jRes] = await Promise.all([
          fetch(API.companyApplications, { credentials: "include", headers: { ...authHeader() } }),
          fetch(API.companyJobs, { credentials: "include", headers: { ...authHeader() } }),
        ]);
        const aJson = await aRes.json();
        const jJson = await jRes.json();

        if (!aRes.ok) throw new Error(aJson?.message || "Failed to load applications");
        if (!jRes.ok) throw new Error(jJson?.message || "Failed to load jobs");

        // robust shape handling (array or {items: []} or {applications: []})
        const appList = Array.isArray(aJson) ? aJson : aJson?.items || aJson?.applications || aJson?.data || [];
        const jobList = Array.isArray(jJson) ? jJson : jJson?.items || jJson?.jobs || jJson?.data || jJson || [];

        if (!cancelled) {
          setApps(appList);
          setJobs(jobList);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ----------------- compute metrics ----------------- */
  const totalApplications = apps.length;
  const acceptedCount = apps.filter((a) => /accepted/i.test(a.status || "")).length;
  const rejectedCount = apps.filter((a) => /rejected/i.test(a.status || "")).length;

  /* ---------- monthly trend (last 12 months) ---------- */
  const trendData = useMemo(() => {
    const months = last12Months(); // array of objects {key,label}
    const map = new Map(months.map((m) => [m.key, 0]));
    for (const a of apps) {
      const when = new Date(a.createdAt || a.appliedAt || a.date || Date.now());
      const k = monthKey(when);
      if (map.has(k)) map.set(k, (map.get(k) || 0) + 1);
    }
    return months.map((m) => ({ month: m.label, key: m.key, applications: map.get(m.key) || 0 }));
  }, [apps]);

  /* ---------- pie: top applied jobs ---------- */
  const pieData = useMemo(() => {
    // count apps per job id / title
    const counts = new Map();
    for (const a of apps) {
      // robust job id/title extraction (application shape varies)
      const jobObj = a.job || a.jobId || a.jobRef || a.job?._id || null;
      const id = (a.job && (a.job._id || a.job.id)) || a.jobId || (jobObj && jobObj._id) || null;
      const title =
        (a.job && (a.job.title || a.job.name)) ||
        a.jobTitle ||
        (typeof a.job === "string" ? a.job : null) ||
        (id ? String(id) : "Unknown");

      const key = `${id || title}::${title || "Unknown"}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    // transform to array with proper labels and sort
    const arr = Array.from(counts.entries()).map(([k, v]) => {
      const parts = k.split("::");
      const id = parts[0];
      const title = parts.slice(1).join("::") || id;
      return { id, title, value: v };
    });
    arr.sort((a, b) => b.value - a.value);
    // limit to top 6, group the rest as "Other"
    const top = arr.slice(0, 6);
    if (arr.length > 6) {
      const rest = arr.slice(6).reduce((s, x) => s + x.value, 0);
      top.push({ id: "other", title: "Other", value: rest });
    }
    return top;
  }, [apps]);

  /* ---------- jobs lookup for top applied titles (optional) ---------- */
  const jobTitleMap = useMemo(() => {
    const m = new Map();
    for (const j of jobs) {
      const id = String(j._id || j.id || (j.companySnapshot && j.companySnapshot._id) || j.title || "");
      const title = j.title || j.jobTitle || j.name || "Untitled";
      m.set(id, title);
    }
    return m;
  }, [jobs]);

  /* map pie data to display labels (prefer jobTitleMap) */
  const pieDisplay = useMemo(() => {
    return pieData.map((p) => {
      let label = p.title;
      // try to clean up id-based labels; if id matches job map, use it
      if (jobTitleMap.has(p.id)) label = jobTitleMap.get(p.id);
      return { name: label, value: p.value };
    });
  }, [pieData, jobTitleMap]);

  /* ---------- render ---------- */
  return (
    <div className="bg-white rounded-xl min-h-[calc(100vh-60px)] p-6">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200">
              <PieIcon className="h-4 w-4 text-gray-600" />
              <div>
                <div className="text-xs text-gray-500">Total Applications</div>
                <div className="text-sm font-semibold">{totalApplications}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200">
              <TrendingUp className="h-4 w-4 text-gray-600" />
              <div>
                <div className="text-xs text-gray-500">Accepted</div>
                <div className="text-sm font-semibold">{acceptedCount}</div>
              </div>
            </div>
          </div>
        </header>

        {err && (
          <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2">{err}</div>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Left: Line Chart */}
          <div className="col-span-8 bg-white rounded-2xl border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Applications Trend (last 12 months)</h2>

            {loading ? (
              <div className="h-72 flex items-center justify-center text-gray-500">Loading…</div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 12, right: 12, left: -8, bottom: 8 }}>
                    <CartesianGrid stroke="#EEF2FF" strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="applications" stroke="#0B63F8" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Right: Pie Chart */}
          <div className="col-span-4 bg-white rounded-2xl border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Top Applied Jobs</h2>

            {loading ? (
              <div className="h-64 flex items-center justify-center text-gray-500">Loading…</div>
            ) : pieDisplay.length === 0 ? (
              <div className="text-sm text-gray-500">No applications yet.</div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieDisplay}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={36}
                      outerRadius={80}
                      paddingAngle={3}
                      label={({ name }) => (name.length > 18 ? `${name.slice(0, 15)}...` : name)}
                    >
                      {pieDisplay.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Optional: small list of top jobs with counts */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Top Jobs (by applications)</h3>
          {loading ? (
            <div className="text-gray-500">Loading…</div>
          ) : pieDisplay.length === 0 ? (
            <div className="text-sm text-gray-500">No data yet.</div>
          ) : (
            <ul className="space-y-3">
              {pieDisplay.map((p, i) => (
                <li key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="rounded-full bg-[#EEF2FF] p-2">
                      <ClipboardList className="h-4 w-4 text-[#0B63F8]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-xs text-gray-500 truncate">Applications: {p.value}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-700">{p.value}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
