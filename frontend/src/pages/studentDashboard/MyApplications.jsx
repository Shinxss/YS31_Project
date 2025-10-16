import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { MapPin, Clock, Building2, Eye } from "lucide-react";

/**
 * MyApplications
 * - Fetches applications for the currently authenticated student (via token)
 * - Endpoint: GET /api/student/applications
 * - Renders a clean, floating card list with subtle dividers
 */
export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  // ----------------------
  // ✅ API base resolver (same pattern used elsewhere)
  // ----------------------
  const RAW_BASE =
    (typeof window !== "undefined" && import.meta?.env?.VITE_API_BASE) || "";
  const IS_VITE =
    typeof window !== "undefined" &&
    /:5173|:5174/.test(window.location.origin);
  const FALLBACK_BASE = IS_VITE
    ? "http://localhost:5000"
    : typeof window !== "undefined"
    ? window.location.origin
    : "";
  const API_BASE = (RAW_BASE && RAW_BASE.trim().length > 0
    ? RAW_BASE
    : FALLBACK_BASE
  ).replace(/\/+$/, "");
  const APPS_URL = `${API_BASE}/api/student/applications`;

  const getAuthHeaders = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("ic_token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(APPS_URL, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        });
        if (res.status === 401) {
          toast.error("Session expired. Please log in again.");
          setApps([]);
          return;
        }
        if (!res.ok) {
          let msg = `Failed to load applications (${res.status})`;
          try {
            const j = await res.json();
            if (j?.message) msg = j.message;
          } catch {}
          throw new Error(msg);
        }
        const data = await res.json();
        setApps(Array.isArray(data) ? data : []); // (kept)

        // 🔶 ADDED: tolerate `{ applications: [...] }` or other common shapes
        const parsed =
          (Array.isArray(data?.applications) && data.applications) ||
          (Array.isArray(data?.items) && data.items) ||
          (Array.isArray(data?.data) && data.data) ||
          (Array.isArray(data) && data) ||
          [];
        setApps(parsed); // ADDED
      } catch (err) {
        console.error("Load applications error:", err);
        toast.error(err.message || "Failed to load applications");
        setApps([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmtDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const StatusPill = ({ status = "Applied" }) => {
    const s = String(status).toLowerCase();
    const map = {
      applied: "bg-blue-100 text-blue-700",
      pending: "bg-yellow-100 text-yellow-700",
      "in review": "bg-yellow-100 text-yellow-700",
      accepted: "bg-green-100 text-green-700",
      shortlisted: "bg-emerald-100 text-emerald-700",
      rejected: "bg-red-100 text-red-600",
      withdrawn: "bg-gray-200 text-gray-700",
    };
    const cls = map[s] || "bg-blue-100 text-blue-700";
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${cls}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">My Applications</h3>
          {!loading && (
            <span className="text-sm text-gray-500">
              {apps.length} {apps.length === 1 ? "application" : "applications"}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Track the status of your internship/job applications.
        </p>

        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-16 rounded-xl bg-gray-100" />
            <div className="h-16 rounded-xl bg-gray-100" />
            <div className="h-16 rounded-xl bg-gray-100" />
          </div>
        ) : apps.length === 0 ? (
          <div className="rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white text-center">
            <p className="text-gray-600">
              You haven’t applied to any opportunities yet.
            </p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-500">
              <div className="col-span-5">Position</div>
              <div className="col-span-3">Company & Location</div>
              <div className="col-span-2">Applied On</div>
              <div className="col-span-2 text-right">Status</div>
            </div>

            {/* Rows */}
            <ul className="divide-y divide-gray-100">
              {apps.map((a) => {
                const id = a._id || `${a.jobId || a.job?._id || Math.random()}`;
                const job = a.job || a.posting || a.listing || {};
                const title =
                  job.title || a.title || "Untitled Opportunity";
                const company =
                  job.companyName ||
                  job.company?.name ||
                  a.companyName ||
                  "Unknown Company";
                const location =
                  job.location ||
                  job.city ||
                  a.location ||
                  "—";
                const created = a.createdAt || a.appliedAt || a.date || null;
                const status = a.status || "Applied";

                return (
                  <li key={id} className="px-4 py-4 bg-white hover:bg-gray-50 transition">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-12 md:col-span-5">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-blue-50">
                            <Eye size={18} className="opacity-70" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-800">
                              {title}
                            </h4>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                              <span className="inline-flex items-center gap-1">
                                <Building2 size={14} /> {company}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-12 md:col-span-3 mt-2 md:mt-0">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <MapPin size={14} />
                          <span>{location}</span>
                        </div>
                      </div>

                      <div className="col-span-6 md:col-span-2 mt-2 md:mt-0">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Clock size={14} />
                          <span>{fmtDate(created)}</span>
                        </div>
                      </div>

                      <div className="col-span-6 md:col-span-2 mt-2 md:mt-0 flex md:justify-end">
                        <StatusPill status={status} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
