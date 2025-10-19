// frontend/src/components/dashboard/JobList.jsx
import React, { useEffect, useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

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

    return () => {
      ignore = true;
      ctrl.abort();
    };
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
    <div className="space-y-4">
      {jobs.map((j) => (
        <div
          key={j._id}
          className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6 flex flex-col gap-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {j.title}
              </div>
              <div className="text-sm text-gray-600 mt-0.5">
                {`${j.applicants?.length || 0} applicants • Posted ${formatDaysAgo(
                  j.createdAt
                )}`}
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                j.status === "open"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {j.status
                ? j.status.charAt(0).toUpperCase() + j.status.slice(1)
                : "Active"}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-700 transition">
              <Eye size={16} /> View
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-700 transition">
              <Pencil size={16} /> Edit
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-700 transition">
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Format salaryMax with a peso sign. */
function formatSalaryMax(value) {
  if (value == null || value === "") return "Salary not specified";
  if (typeof value === "string" && value.trim().startsWith("₱")) {
    return value.trim();
  }
  const n = Number(
    typeof value === "string" ? value.replace(/[^\d.]/g, "") : value
  );
  if (!Number.isFinite(n)) return "Salary not specified";
  return `₱${n.toLocaleString("en-PH")}`;
}

/** Format posted date as “2 days ago” */
function formatDaysAgo(dateString) {
  if (!dateString) return "recently";
  const posted = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - posted) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}