import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { MapPin, Clock, Building2, Eye } from "lucide-react";

/**
 * MyApplications (fixed-height card + scrollable list + A–Z position sort)
 * - Withdrawn applications are excluded immediately after fetch.
 */
export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  // Sort order for Position
  const [sortOrder, setSortOrder] = useState("default"); // default | title-asc | title-desc

  /* ---------------------------- Helpers ---------------------------- */
  const normalize = (v = "") => String(v).trim().toLowerCase().replace(/\s+/g, " ");
  const canonicalStatus = (raw = "") => {
    const s = normalize(raw);
    if (s === "new") return "application sent";
    if (["under review", "accepted", "rejected", "withdrawn"].includes(s)) return s;
    return "application sent";
  };

  /* ---------------------------- API base resolver ---------------------------- */
  const RAW_BASE =
    (typeof window !== "undefined" && import.meta?.env?.VITE_API_BASE) || "";
  const IS_VITE =
    typeof window !== "undefined" && /:5173|:5174/.test(window.location.origin);
  const FALLBACK_BASE = IS_VITE
    ? "http://localhost:5000"
    : typeof window !== "undefined"
    ? window.location.origin
    : "";
  const API_BASE = (RAW_BASE && RAW_BASE.trim().length > 0 ? RAW_BASE : FALLBACK_BASE).replace(
    /\/+$/,
    ""
  );
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
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
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
        const parsed =
          (Array.isArray(data?.applications) && data.applications) ||
          (Array.isArray(data?.items) && data.items) ||
          (Array.isArray(data?.data) && data.data) ||
          (Array.isArray(data) && data) ||
          [];

        // 🔒 Exclude withdrawn before setting state
        const withoutWithdrawn = parsed.filter(
          (a) => canonicalStatus(a?.status) !== "withdrawn"
        );

        setApps(withoutWithdrawn);
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
    return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  const PALETTE = {
    blue: "bg-blue-100 text-blue-700",
    yellow: "bg-yellow-100 text-yellow-800",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-200 text-gray-700",
  };

  const StatusPill = ({ status = "Application Sent" }) => {
    const can = canonicalStatus(status);
    const cls =
      can === "application sent"
        ? PALETTE.blue
        : can === "under review"
        ? PALETTE.yellow
        : can === "accepted"
        ? PALETTE.green
        : can === "rejected"
        ? PALETTE.red
        : can === "withdrawn"
        ? PALETTE.gray
        : PALETTE.blue;

    const label =
      can === "application sent"
        ? "Application Sent"
        : can
            .split(" ")
            .map((w) => w[0]?.toUpperCase() + w.slice(1))
            .join(" ");

    return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${cls}`}>{label}</span>;
  };

  // Filter first (withdrawn never included in `apps`)
  const filtered = useMemo(() => {
    const q = normalize(query);
    const s = normalize(statusFilter);
    return apps.filter((a) => {
      const job = a.job || a.posting || a.listing || {};
      const title = String(job.title || a.title || "").toLowerCase();
      const company = String(job.companyName || job.company?.name || a.companyName || "").toLowerCase();
      const location = String(job.location || job.city || a.location || "").toLowerCase();

      const matchesQuery = !q || title.includes(q) || company.includes(q) || location.includes(q);
      const can = canonicalStatus(a.status || "application sent");
      const matchesStatus = s === "all" || can === s;

      return matchesQuery && matchesStatus;
    });
  }, [apps, query, statusFilter]);

  // Then sort by Position (title) if requested
  const filteredAndSorted = useMemo(() => {
    if (sortOrder === "default") return filtered;

    const copy = [...filtered];
    copy.sort((a, b) => {
      const at =
        String(a?.job?.title || a?.title || "").toLocaleLowerCase?.() ||
        String(a?.job?.title || a?.title || "").toLowerCase();
      const bt =
        String(b?.job?.title || b?.title || "").toLocaleLowerCase?.() ||
        String(b?.job?.title || b?.title || "").toLowerCase();

      const cmp = at.localeCompare(bt);
      return sortOrder === "title-asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortOrder]);

  const STATUS_OPTIONS = [
    { value: "all", label: "All statuses" },
    { value: "application sent", label: "Application Sent" },
    { value: "under review", label: "Under Review" },
    { value: "accepted", label: "Accepted" },
    { value: "rejected", label: "Rejected" },
    // withdrawn intentionally omitted
  ];

  const SORT_OPTIONS = [
    { value: "default", label: "Default order" },
    { value: "title-asc", label: "Position A–Z" },
    { value: "title-desc", label: "Position Z–A" },
  ];

  return (
    <div className="space-y-6">
      {/* Fixed-height card */}
      <section className="bg-white rounded-2xl shadow-sm p-6 h-[600px] md:h-[660px] flex flex-col">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <h3 className="text-lg font-semibold text-gray-800">My Applications</h3>
          {!loading && (
            <span className="text-sm text-gray-500">
              {filteredAndSorted.length} shown
              {filteredAndSorted.length !== apps.length ? ` of ${apps.length}` : ""}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-4 shrink-0">
          Track the status of your internship/job applications.
        </p>

        {/* Toolbar: Search + Status + Sort */}
        {!loading && apps.length > 0 && (
          <div className="mb-4 grid grid-cols-1 md:grid-cols-12 gap-3 shrink-0">
            {/* Search */}
            <div className="md:col-span-6">
              <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by position, company, or location…"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    title="Clear"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort by Position */}
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Sort</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Scroll area */}
        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-16 rounded-xl bg-gray-100" />
              <div className="h-16 rounded-xl bg-gray-100" />
              <div className="h-16 rounded-xl bg-gray-100" />
            </div>
          ) : apps.length === 0 ? (
            <div className="rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white text-center">
              <p className="text-gray-600">You haven’t applied to any opportunities yet.</p>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="rounded-xl p-4 border border-amber-200 bg-amber-50 text-amber-800 text-sm">
              No results match your current filters.
              <button
                className="ml-3 underline"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("all");
                  setSortOrder("default");
                }}
              >
                Reset
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-100 overflow-hidden h-full flex flex-col">
              {/* Sticky header */}
              <div className="hidden md:grid grid-cols-12 gap-15 pl-4 pr-10 py-3 bg-gray-50 text-xs font-semibold text-gray-500 sticky top-0 z-10">
                <div className="col-span-5">Company &amp; Position</div>
                <div className="col-span-3">Location</div>
                <div className="col-span-2">Applied On</div>
                <div className="col-span-2 text-right">Status</div>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto">
                <ul className="divide-y divide-gray-100">
                  {filteredAndSorted.map((a) => {
                    const id = a._id || `${a.jobId || a.job?._id || Math.random()}`;
                    const job = a.job || a.posting || a.listing || {};
                    const title = job.title || a.title || "Untitled Opportunity";
                    const company =
                      job.companyName || job.company?.name || a.companyName || "Unknown Company";
                    const location = job.location || job.city || a.location || "—";
                    const created = a.createdAt || a.appliedAt || a.date || null;
                    const status = a.status || "Application Sent";

                    return (
                      <li key={id} className="px-4 py-4 bg-white hover:bg-gray-50 transition">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-12 md:col-span-5">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-xl bg-blue-50">
                                <Eye size={18} className="opacity-70" />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
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
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
