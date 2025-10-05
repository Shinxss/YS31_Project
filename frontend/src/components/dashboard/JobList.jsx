import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const CURRENCY_SYMBOLS = { PHP: "₱", USD: "$", EUR: "€", GBP: "£", JPY: "¥" };

export default function JobList({ token }) {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/jobs/mine`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ctrl.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load jobs");
        if (!ignore) setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      } catch (e) {
        if (!ignore && e.name !== "AbortError") setError(e.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; ctrl.abort(); };
  }, [token]);

  if (loading) return <div className="text-gray-600">Loading jobs…</div>;
  if (error) return <div className="text-red-600 text-sm">❌ {error}</div>;
  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
        You haven’t posted any jobs yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((j) => (
        <div key={j._id} className="bg-white rounded-xl border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">{j.title}</div>
            <div className="text-sm text-gray-600 mt-0.5">
              {j.workType || "On-site"} • {j.location || "—"}
            </div>
            <div className="text-sm text-gray-600 mt-0.5">
              {formatSalary(j)}
              {j.durationMonths != null && <> • {j.durationMonths} mo.</>}
              {j.startDate && <> • Starts {formatDate(j.startDate)}</>}
            </div>
            {Array.isArray(j.tags) && j.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {j.tags.map((t, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs ${j.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>
              {j.status || "open"}
            </span>
            {/* Future: Edit/Delete buttons go here */}
          </div>
        </div>
      ))}
    </div>
  );

  function formatSalary(j) {
    const sym = CURRENCY_SYMBOLS[j.salaryCurrency] || "";
    const min = isNum(j.salaryMin) ? `${sym}${Number(j.salaryMin).toLocaleString()}` : "";
    const max = isNum(j.salaryMax) ? `${sym}${Number(j.salaryMax).toLocaleString()}` : "";
    if (min && max) return `${min} – ${max}`;
    if (min) return min;
    if (max) return max;
    return "Salary not specified";
  }
  function isNum(x) { return typeof x === "number" && !isNaN(x); }
  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch { return iso; }
    }
}
