// src/pages/admin/AdminDashboardHome.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Building2,
  BriefcaseBusiness,
  FileText,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

/* ---------- API base (same resolver style as LandingPage) ---------- */
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const STATS_PUBLIC = `${API_BASE}/api/stats/public`;
const JOBS_URL = `${API_BASE}/api/jobs`;
const APPS_TOTAL_URL = `${API_BASE}/api/applications/stats`;
const APPS_MONTHLY_URL = `${API_BASE}/api/stats/applications/monthly`;

/* ---------- helpers ---------- */
const numberFmt = (n) => (typeof n === "number" ? n.toLocaleString() : "—");

function deriveTopFields(jobs, limit = 5) {
  const pick = (j) =>
    j.field || j.category || j.department || j.jobField || j.role || null;
  const map = new Map();
  (jobs || []).forEach((j) => {
    const k = (pick(j) || "").toString().trim();
    if (!k) return;
    map.set(k, (map.get(k) || 0) + 1);
  });
  return [...map.entries()]
    .map(([field, postings]) => ({ field, postings }))
    .sort((a, b) => b.postings - a.postings)
    .slice(0, limit);
}

function monthLabel(d) {
  return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()];
}
function last12Skeleton() {
  const now = new Date();
  const out = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${d.getMonth() + 1}`,
      month: monthLabel(d),
      applications: 0,
    });
  }
  return out;
}
function aggregateAppsMonthly(apps = []) {
  const base = last12Skeleton();
  const idx = Object.fromEntries(base.map((r) => [r.key, r]));
  for (const a of apps) {
    const dt = a?.createdAt ? new Date(a.createdAt) : null;
    if (!dt || Number.isNaN(dt)) continue;
    const key = `${dt.getFullYear()}-${dt.getMonth() + 1}`;
    if (idx[key]) idx[key].applications += 1;
  }
  return base;
}

/* ---------- UI atoms (colored + delta stat cards) ---------- */
function StatCard({ icon, title, value, delta }) {
  // Color mapping by title
  const colorConfig = {
    "Total Students": {
      border: "border-orange-500",
      icon: "text-orange-500",
      change: "+2 from last week",
    },
    "Total Verified Companies": {
      border: "border-blue-500",
      icon: "text-blue-500",
      change: "+2 from last week",
    },
    "Total Active Job Listings": {
      border: "border-blue-500",
      icon: "text-blue-500",
      change: "+2 from last week",
    },
    "Total Applications Received": {
      border: "border-yellow-500",
      icon: "text-yellow-500",
      change: "+2 from last week",
    },
  };

  const style = colorConfig[title] || {
    border: "border-gray-300",
    icon: "text-gray-500",
    change: "— from last week",
  };

  return (
    <div
      className={`bg-white rounded-lg border-l-4 ${style.border} shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition`}
    >
      <p className="text-xs text-gray-600 mb-2">{title}</p>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-semibold text-gray-800">
            {numberFmt(value)}
          </div>
          <div className="text-xs text-gray-500 mt-1">{style.change}</div>
        </div>

        <div
          className={`h-10 w-10 rounded-md bg-gray-50 flex items-center justify-center ${style.icon}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function AdminDashboardHome() {
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    students: 0,
    companies: 0,
    jobs: 0,
    applications: 0,
  });
  const [monthlyApps, setMonthlyApps] = useState(last12Skeleton());
  const [topFields, setTopFields] = useState([]);

  useEffect(() => {
    let stop = false;

    (async () => {
      setLoading(true);
      try {
        /* 1) Counts from /api/stats/public */
        const s = await fetch(STATS_PUBLIC);
        const sj = await s.json();
        const students = sj.activeStudents ?? sj.students ?? 0;
        const companies = sj.companies ?? 0;
        const jobs = sj.internships ?? sj.jobs ?? 0;

        /* 2) Total applications */
        let applications = 0;
        try {
          const aRes = await fetch(APPS_TOTAL_URL);
          if (aRes.ok) {
            const aJson = await aRes.json();
            applications = aJson?.totalApplications ?? 0;
          }
        } catch {
          applications = 0;
        }

        /* 3) Top job fields */
        const j = await fetch(JOBS_URL);
        const jj = await j.json();
        const jobsArr = Array.isArray(jj?.jobs) ? jj.jobs : [];
        const fields = deriveTopFields(jobsArr, 5);

        /* 4) Monthly applications */
        let monthly = null;
        try {
          const m = await fetch(APPS_MONTHLY_URL);
          if (m.ok) {
            const mj = await m.json();
            if (Array.isArray(mj) && mj.every(x => "month" in x && "applications" in x)) {
              monthly = mj;
            }
          }
        } catch {/* ignore */}

        if (!monthly) {
          try {
            const r = await fetch(`${API_BASE}/api/applications?limit=1000`);
            const d = await r.json();
            const list =
              Array.isArray(d?.applications) ? d.applications :
              Array.isArray(d?.data) ? d.data :
              Array.isArray(d) ? d : [];
            monthly = aggregateAppsMonthly(list);
          } catch {
            monthly = last12Skeleton();
          }
        }

        if (!stop) {
          setTotals({ students, companies, jobs, applications });
          setTopFields(fields);
          setMonthlyApps(monthly);
        }
      } finally {
        if (!stop) setLoading(false);
      }
    })();

    return () => { stop = true; };
  }, []);

  const barData = useMemo(
    () => topFields.map((t) => ({ name: t.field, postings: t.postings })),
    [topFields]
  );

  return (
    <div className="p-6">
      {/* Header */}
      <h1 className="text-2xl font-extrabold">Welcome back, Admin</h1>
      <p className="text-sm text-gray-600 mt-1">Here is your platform overview</p>

      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        <StatCard
          title="Total Students"
          value={totals.students}
          icon={<Users size={18} />}
        />
        <StatCard
          title="Total Verified Companies"
          value={totals.companies}
          icon={<Building2 size={18} />}
        />
        <StatCard
          title="Total Active Job Listings"
          value={totals.jobs}
          icon={<BriefcaseBusiness size={18} />}
        />
        <StatCard
          title="Total Applications Received"
          value={totals.applications}
          icon={<FileText size={18} />}
        />
      </div>

      {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          {/* Applications per Month */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col h-[400px]">
            <div>
              <p className="text-xl font-bold">Applications per Month</p>
              <p className="text-xs text-gray-500">
                Monthly application volume over the last 12 months
              </p>
            </div>
            <div className="flex-1 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyApps}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" height={30} />
                  <YAxis allowDecimals={false} width={35} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    name="Applications"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Job Fields */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col h-[400px]">
            <div>
              <p className="text-xl font-bold">Top Job Fields</p>
              <p className="text-xs text-gray-500">
                Top 5 fields with highest active job postings
              </p>
            </div>
            <div className="flex-1 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-25}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis allowDecimals={false} width={35} />
                  <Tooltip />
                  <Bar
                    dataKey="postings"
                    fill="#2563eb"
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>


      {loading && <div className="text-xs text-gray-500 mt-3">Loading…</div>}
    </div>
  );
}
