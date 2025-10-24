// src/pages/dashboard/JobPostingsPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  companyJobs: api("/api/company/jobs"),
  companyApps: api("/api/company/applications"),
};

/* -------------------------------------------------------
   Small helpers
------------------------------------------------------- */
const normalize = (v = "") => String(v).trim().toLowerCase().replace(/\s+/g, " ");

const statusBadge = (raw) => {
  const s = normalize(raw);
  if (s.includes("closed") || s.includes("archive"))
    return { label: "Closed", cls: "bg-red-50 text-red-700 border-red-200" };
  if (s.includes("pending"))
    return { label: "Pending Review", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: "Open", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
};

const KebabIcon = ({ className = "" }) => <span className={className} aria-hidden>⋯</span>;

/* -------------------------------------------------------
   Page
------------------------------------------------------- */
export default function JobPostingsPage() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Filters
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date"); // date | title

  // Tabs: active vs archived
  const [tab, setTab] = useState("active"); // active | archived

  // Row menu
  const [openMenuId, setOpenMenuId] = useState(null);
  const tableRef = useRef(null);

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // Per-row action loading indicator (id of row being updated)
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Token (prefer company token)
  const authHeader = () => {
    const token =
      (typeof window !== "undefined" && localStorage.getItem("ic_company_token")) ||
      (typeof window !== "undefined" && localStorage.getItem("ic_token")) ||
      null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  /* ---------- Load jobs + applications ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const [jr, ar] = await Promise.all([
          fetch(API.companyJobs, { credentials: "include", headers: { ...authHeader() } }),
          fetch(API.companyApps, { credentials: "include", headers: { ...authHeader() } }),
        ]);

        const jjson = await jr.json();
        const ajson = await ar.json();

        if (!jr.ok) throw new Error(jjson?.message || "Failed to load jobs");
        if (!ar.ok) throw new Error(ajson?.message || "Failed to load applications");

        const jobList = Array.isArray(jjson) ? jjson : jjson?.items || jjson?.jobs || [];
        const appList = Array.isArray(ajson) ? ajson : ajson?.items || ajson?.applications || [];

        if (!cancelled) {
          setJobs(jobList);
          setApps(appList);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load job postings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Build applications-per-job map ---------- */
  const appsPerJob = useMemo(() => {
    const map = new Map();
    for (const a of apps) {
      const jid = a?.job?._id || a?.jobId || a?.job || a?.job?._id?.$oid || null;
      if (!jid) continue;
      map.set(String(jid), (map.get(String(jid)) || 0) + 1);
    }
    return map;
  }, [apps]);

  /* ---------- Derived lists for filters/tabs ---------- */
  const categories = useMemo(() => {
    const set = new Set();
    jobs.forEach((j) => {
      const c = j.category || j.department || j.categoryName || "";
      if (c) set.add(c);
    });
    return Array.from(set);
  }, [jobs]);

  const partitioned = useMemo(() => {
    const active = [];
    const archived = [];
    for (const j of jobs) {
      const s = normalize(j.status || j.state || (j.isActive ? "open" : "closed"));
      const isArchived = j.isArchived || s.includes("archive") || s.includes("closed");
      (isArchived ? archived : active).push(j);
    }
    return { active, archived };
  }, [jobs]);

  const baseList = tab === "active" ? partitioned.active : partitioned.archived;

  const filtered = useMemo(() => {
    const q = normalize(query);
    const cat = normalize(catFilter);
    const st = normalize(statusFilter);

    return baseList.filter((j) => {
      const title = normalize(j.title || "");
      const dept = normalize(j.category || j.department || "");
      const status = normalize(j.status || j.state || (j.isActive ? "open" : "closed"));

      const matchQ = !q || title.includes(q) || dept.includes(q);
      const matchCat = cat === "all" || dept === cat;
      const matchStatus =
        st === "all" ||
        (st === "open" && status.includes("open")) ||
        (st === "pending" && status.includes("pending")) ||
        (st === "closed" && (status.includes("closed") || status.includes("archive")));

      return matchQ && matchCat && matchStatus;
    });
  }, [baseList, query, catFilter, statusFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sortBy === "title") {
      list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else {
      list.sort(
        (a, b) =>
          new Date(b.createdAt || b.datePosted || 0) -
          new Date(a.createdAt || a.datePosted || 0)
      );
    }
    return list;
  }, [filtered, sortBy]);

  /* ---------- Pagination ---------- */
  const totalResults = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const visible = sorted.slice(startIdx, startIdx + rowsPerPage);

  useEffect(() => {
    // Reset to first page when filters or rows-per-page change
    setPage(1);
  }, [catFilter, statusFilter, query, rowsPerPage, tab]);

  /* ---------- Close row menu on outside click ---------- */
  useEffect(() => {
    const onDoc = (e) => {
      if (!tableRef.current) return;
      if (!tableRef.current.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const goCreate = () => navigate("/company/post-job");

  /* ---------- Helper to update job locally ---------- */
  const updateJobInState = (id, patch) => {
    setJobs((prev) =>
      prev.map((j) => {
        const jid = String(j._id || j.id || j.slug || "");
        if (jid === String(id)) return { ...j, ...patch };
        return j;
      })
    );
  };

  /* ---------- Actions: delete (status-only), edit, archive/unarchive ---------- */
  const handleDelete = async (id) => {
    // status-only delete: mark as deleted/closed instead of hard-delete if backend expects it.
    // Ask user for confirmation (safe UX)
    const ok = window.confirm("Delete this job? This will mark it as deleted/closed.");
    if (!ok) {
      setOpenMenuId(null);
      return;
    }

    setActionLoadingId(id);
    setErr("");
    try {
      // Try soft-delete via PATCH status = 'deleted' or isArchived: true
      const payload = { status: "deleted", isArchived: true };
      const res = await fetch(`${API.companyJobs}/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // fallback: attempt DELETE
        const del = await fetch(`${API.companyJobs}/${id}`, {
          method: "DELETE",
          credentials: "include",
          headers: { ...authHeader() },
        });
        if (!del.ok) {
          const errJson = await del.json().catch(() => ({}));
          throw new Error(errJson?.message || "Failed to delete job");
        } else {
          // remove from local state entirely
          setJobs((prev) => prev.filter((j) => String(j._id || j.id || j.slug || "") !== String(id)));
        }
      } else {
        const updated = await res.json().catch(() => ({}));
        updateJobInState(id, { ...(updated || {}), isArchived: true });
      }
    } catch (e) {
      setErr(e.message || "Failed to delete job.");
    } finally {
      setActionLoadingId(null);
      setOpenMenuId(null);
    }
  };

  const handleEdit = (id) => {
    // Navigate to your edit page — adjust path if your routing differs
    setOpenMenuId(null);
    navigate(`/company/post-job/${id}`); // assumes same page handles edit when id param present
  };

  const handleToggleArchive = async (id) => {
    setActionLoadingId(id);
    setErr("");

    // Find job in state to know current
    const job = jobs.find((j) => String(j._id || j.id || j.slug || "") === String(id));
    const currentStatus = (job && (job.status || (job.isActive ? "open" : "closed"))) || "open";
    const isCurrentlyArchived = job?.isArchived || normalize(currentStatus).includes("closed") || normalize(currentStatus).includes("archive") || normalize(currentStatus).includes("deleted");

    const newStatus = isCurrentlyArchived ? "open" : "closed";
    const payload = { status: newStatus, isArchived: !isCurrentlyArchived };

    // Optimistic update
    updateJobInState(id, { status: newStatus, isArchived: payload.isArchived });

    try {
      const res = await fetch(`${API.companyJobs}/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.message || "Failed to update job status");
      }

      // If backend returns updated job, merge it
      const updated = await res.json().catch(() => null);
      if (updated) updateJobInState(id, updated);
    } catch (e) {
      // revert optimistic change
      updateJobInState(id, { status: currentStatus, isArchived: job?.isArchived || false });
      setErr(e.message || "Failed to update job status.");
    } finally {
      setActionLoadingId(null);
      setOpenMenuId(null);
    }
  };

  /* ---------- Render ---------- */
  return (
    <div className="bg-white rounded-2xl min-h-[calc(100vh-60px)]">
      <div className="max-w-[1150px] mx-auto py-6">
        {/* Top bar: title + create */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-[#173B8A]">Job Postings</h1>
          <button
            onClick={goCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F37526] text-white text-sm shadow-sm hover:bg-[#fd9b5f]"
          >
            <span className="text-base leading-none">＋</span> Post New Job
          </button>
        </div>

        {/* Filters row */}
        <div className="grid grid-cols-12 gap-3 items-center">
          <div className="col-span-5">
            <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2">
              <span className="text-gray-400"></span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title…"
                className="w-full outline-none text-sm"
              />
            </div>
          </div>

          <div className="col-span-2">
            <label className="sr-only">Category</label>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="sr-only">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="pending">Pending Review</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="col-span-3">
            <label className="sr-only">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="date">Date Posted</option>
              <option value="title">Title (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Tabs bar */}
        <div className="mt-4 flex rounded-lg border border-gray-200 bg-white overflow-hidden">
          <button
            className={`flex-1 py-2 text-sm ${tab === "active" ? "bg-gray-100 font-medium" : "text-gray-600"}`}
            onClick={() => setTab("active")}
          >
            Active Listings
          </button>
          <button
            className={`flex-1 py-2 text-sm ${tab === "archived" ? "bg-gray-100 font-medium" : "text-gray-600"}`}
            onClick={() => setTab("archived")}
          >
            Archived Listings
          </button>
        </div>

        {/* Table */}
        <div className="mt-4 rounded-lg border border-white bg-white overflow-visible" ref={tableRef}>
          <div className="grid grid-cols-12 gap-3 px-4 py-3 text-xs font-semibold text-gray-600 bg-[#F6F7FA]">
            <div className="col-span-4">Job Title</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Date Posted</div>
            <div className="col-span-1">Applications</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {err && (
            <div className="px-4 py-3 text-sm text-red-600 border-t">{err}</div>
          )}

          {loading ? (
            <div className="p-4 space-y-3">
              <div className="h-16 bg-gray-100 rounded" />
              <div className="h-16 bg-gray-100 rounded" />
              <div className="h-16 bg-gray-100 rounded" />
            </div>
          ) : visible.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-600">No job postings found.</div>
          ) : (
            <ul className="divide-y divide-gray-300">
              {visible.map((j) => {
                const id = String(j._id || j.id || j.slug || "");
                const loc = j.location || j.city || j.shortDescription || "";
                const dept = j.category || j.department || "—";
                const when = j.createdAt || j.datePosted || null;
                const appsCount = appsPerJob.get(id) || 0;
                const st = statusBadge(j.status || (j.isActive ? "Open" : "Closed"));
                const isActionLoading = actionLoadingId === id;
                const isArchived = j.isArchived || normalize(j.status || (j.isActive ? "open" : "closed")).includes("closed") || normalize(j.status || "").includes("archive") || normalize(j.status || "").includes("deleted");

                return (
                  <li key={id} className="px-4 py-4 grid grid-cols-12 gap-3 items-center">
                    {/* Job Title + secondary line */}
                    <div className="col-span-4 min-w-0">
                      <p className="text-sm text-gray-900">{j.title || "Untitled"}</p>
                      <p className="text-xs text-gray-500 mt-1">{loc || "—"}</p>
                    </div>

                    {/* Category pill */}
                    <div className="col-span-2">
                      <span className="inline-block rounded-full border bg-gray-100 text-gray-700 text-xs px-3 py-1">
                        {dept}
                      </span>
                    </div>

                    {/* Status pill */}
                    <div className="col-span-2">
                      <span className={`inline-block rounded-full border text-xs px-3 py-1 ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>

                    {/* Date (NO time-ago) */}
                    <div className="col-span-2 text-sm text-gray-900">
                      {when ? new Date(when).toISOString().slice(0, 10) : "—"}
                    </div>

                    {/* Applications (bold number) */}
                    <div className="col-span-1 text-sm font-semibold text-gray-900">
                      {appsCount}
                    </div>

                    {/* Actions (kebab) */}
                    <div className="col-span-1 relative flex justify-end">
                      <button
                        className="p-2 rounded hover:bg-gray-100"
                        onClick={() => setOpenMenuId((cur) => (cur === id ? null : id))}
                        aria-label="Actions"
                        disabled={isActionLoading}
                      >
                        <KebabIcon className="text-xl text-gray-600 leading-none" />
                      </button>

                      {openMenuId === id && (
                        <div className="absolute right-0 top-9 w-44 rounded-md border bg-white shadow-md z-10">
                          <button
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                            onClick={() => {
                              setOpenMenuId(null);
                              navigate(`/company/job/${id}`); // view route, adjust if needed
                            }}
                          >
                            View
                          </button>

                          <button
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                            onClick={() => handleEdit(id)}
                          >
                            Edit
                          </button>

                          <button
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                            onClick={() => handleToggleArchive(id)}
                            disabled={isActionLoading}
                          >
                            {isActionLoading ? "Updating…" : isArchived ? "Unarchive / Reopen" : "Archive / Close"}
                          </button>

                          <div className="h-px bg-gray-100" />
                          <button
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(id)}
                            disabled={isActionLoading}
                          >
                            {isActionLoading ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Pagination footer */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Rows:&nbsp;
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
              className="border rounded px-1.5 py-1 text-sm"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="ml-3">{startIdx + 1}-{Math.min(startIdx + rowsPerPage, totalResults)} of {totalResults} results</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`px-3 py-1 rounded border text-sm ${currentPage <= 1 ? "text-gray-400 border-gray-200" : "text-gray-700 hover:bg-gray-50"}`}
            >
              Previous
            </button>

            {/* Simple page indicator (current) */}
            <span className="min-w-[28px] text-center px-2 py-1 rounded bg-[#0B63F8] text-white text-sm">
              {currentPage}
            </span>

            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={`px-3 py-1 rounded border text-sm ${currentPage >= totalPages ? "text-gray-400 border-gray-200" : "text-gray-700 hover:bg-gray-50"}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
