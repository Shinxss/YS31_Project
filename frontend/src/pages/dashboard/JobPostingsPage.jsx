// src/pages/dashboard/JobPostingsPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { confirmAction } from "@/utils/confirm";
import { Search } from "lucide-react";

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

/**
 * statusBadge - maps raw status to label + tailwind classes
 * supported labels: Open, Pending Review, Closed, Archived, Deleted, Suspended
 */
const statusBadge = (raw) => {
  const s = normalize(raw);
  if (s.includes("deleted"))
    return { label: "Deleted", cls: "bg-red-100 text-red-600 border-red-200" };
  if (s.includes("archiv"))
    return { label: "Archived", cls: "bg-gray-100 text-gray-600 border-gray-200" };
  if (s.includes("suspend"))
    return { label: "Suspended", cls: "bg-amber-100 text-amber-600 border-amber-200" };
  if (s.includes("pending"))
    return { label: "Pending Review", cls: "bg-amber-100 text-amber-600 border-amber-200" };
  if (s.includes("closed"))
    return { label: "Closed", cls: "bg-red-100 text-red-600 border-red-200" };
  // default -> open
  return { label: "Open", cls: "bg-emerald-100 text-emerald-600 border-emerald-200" };
};

const KebabIcon = ({ className = "" }) => <span className={className} aria-hidden>⋯</span>;

/* -------------------------------------------------------
   ID + path helpers (for stable navigation)
------------------------------------------------------- */
const getJobId = (job) =>
  String(job?._id?.$oid || job?._id || job?.id || job?.slug || "");

const jobDetailPath = (id) => `/company/job/${encodeURIComponent(id)}`;

/* -------------------------------------------------------
   Job Detail Modal (inline) - modified UI per request
   - separator line between header and content
   - right column uses floating cards (no border stroke)
   - Work Experience, Education, Certifications: plain text blocks (no card bg/border)
------------------------------------------------------- */
function JobDetailModal({ job, apps, onClose, onEdit, onToggleArchive, onCloseReopen, onDelete }) {
  if (!job) return null;

  const appsForJob = apps.filter((a) => {
    const jid = String(a?.job?._id || a?.jobId || a?.job || a?.job?._id?.$oid || "");
    const jobId = String(job._id || job.id || job.slug || "");
    return jid === jobId;
  });

  const st = statusBadge(job.status || (job.isActive ? "Open" : "Closed"));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6 bg-black/40">
      <div className="w-full max-w-[1150px] bg-white rounded-2xl shadow-xl overflow-auto max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#173B8A]">{job.title || "Untitled"}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span>{job.location || job.city || "Remote / —"}</span>
              <span>•</span>
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs">
                <span className={`${st.cls} inline-block rounded-full px-2 py-0.5 text-xs`}>{st.label}</span>
              </span>
              <span>•</span>
              <span>{job.salary || ""}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
            >
              Edit
            </button>

            <button
              onClick={() => onToggleArchive(job)}
              className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
            >
              {normalize(job.status || "").includes("archiv") ? "Unarchive" : "Archive"}
            </button>

            <button
              onClick={() => onCloseReopen(job)}
              className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
            >
              {normalize(job.status || "").includes("closed") ? "Reopen" : "Close Job"}
            </button>

            <button
              onClick={() => onDelete(job)}
              className="px-3 py-2 rounded-lg border text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>

            <button onClick={onClose} aria-label="Close" className="ml-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">
              Close
            </button>
          </div>
        </div>

        {/* Separator line between header and the rest */}
        <hr className="border-t border-gray-200" />

        {/* Content */}
        <div className="px-6 py-6 grid grid-cols-12 gap-6">
          {/* Left column: Description + requirements + profile-like sections */}
          <div className="col-span-7 space-y-6">
            <section className="rounded-lg">
              <div className="p-4">
                <h3 className="font-medium text-gray-800 mb-2">Job Description</h3>
                <div className="text-sm text-gray-700 space-y-3">
                  <div dangerouslySetInnerHTML={{ __html: job.description || job.shortDescription || "<p>No description provided.</p>" }} />
                </div>
              </div>
            </section>

            <section className="">
              <div className="px-0 py-0">
                <h3 className="font-medium text-gray-800 mb-2">Requirements</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {(job.requirements && Array.isArray(job.requirements) ? job.requirements : (job.requirements ? [job.requirements] : []))
                    .map((r, i) => <li key={i}>{r}</li>)}
                  {/* fallback bullets from common fields */}
                  {!job.requirements && (
                    <>
                      {job.minQualifications && <li>{job.minQualifications}</li>}
                      {job.skills && Array.isArray(job.skills) && job.skills.map((s, idx) => <li key={`s${idx}`}>{s}</li>)}
                      {!job.minQualifications && !job.skills && <li>No specific requirements listed.</li>}
                    </>
                  )}
                </ul>
              </div>
            </section>

            {/* WORK EXPERIENCE - removed card bg + border */}
            <section className="">
              <div className="px-0 py-0">
                <h3 className="font-medium text-gray-800 mb-2">Work Experience</h3>
                <div className="text-sm text-gray-700 space-y-2">
                  {(job.workExperience && Array.isArray(job.workExperience) ? job.workExperience : [])
                    .map((w, i) => (
                      <div key={i} className="text-sm">
                        <div className="font-medium">{w.role || w.title}</div>
                        <div className="text-gray-500 text-xs">{w.company} • {w.period}</div>
                        {w.description && <div className="mt-1">{w.description}</div>}
                      </div>
                    ))}
                  {!job.workExperience && <div className="text-gray-500">No work experience listed.</div>}
                </div>
              </div>
            </section>

            {/* EDUCATION - removed card bg + border */}
            <section className="">
              <div className="px-0 py-0">
                <h3 className="font-medium text-gray-800 mb-2">Education</h3>
                <div className="text-sm text-gray-700 space-y-2">
                  {(job.education && Array.isArray(job.education) ? job.education : [])
                    .map((e, idx) => (
                      <div key={idx} className="text-sm">
                        <div className="font-medium">{e.institution}</div>
                        <div className="text-gray-500 text-xs">{e.degree} • {e.year}</div>
                      </div>
                    ))}
                  {!job.education && <div className="text-gray-500">No education listed.</div>}
                </div>
              </div>
            </section>

            {/* CERTIFICATIONS - removed card bg + border */}
            <section className="">
              <div className="px-0 py-0">
                <h3 className="font-medium text-gray-800 mb-2">Certifications</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  {(job.certifications && Array.isArray(job.certifications) ? job.certifications : [])
                    .map((c, i) => <div key={i} className="text-sm">{c}</div>)}
                  {!job.certifications && <div className="text-gray-500">No certifications listed.</div>}
                </div>
              </div>
            </section>
          </div>

          {/* Right column: floating cards (no stroke, subtle shadow) */}
          <div className="col-span-5 space-y-6">
            <div className="rounded-lg bg-white p-4 shadow-md">
              <h4 className="text-sm font-semibold text-gray-700">Quick Info</h4>
              <div className="mt-3 text-sm text-gray-600 space-y-2">
                <div><span className="font-medium text-gray-800">Category:</span> {job.category || job.department || "—"}</div>
                <div><span className="font-medium text-gray-800">Type:</span> {job.type || "—"}</div>
                <div><span className="font-medium text-gray-800">Duration:</span> {job.duration || "—"}</div>
                <div><span className="font-medium text-gray-800">Posted:</span> {job.createdAt ? new Date(job.createdAt).toISOString().slice(0,10) : "—"}</div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-4 shadow-md">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">Applicants</h4>
                <span className="text-sm text-gray-500">{appsForJob.length} applicants</span>
              </div>

              <div className="mt-3">
                {appsForJob.length === 0 ? (
                  <div className="text-sm text-gray-500">No applicants yet.</div>
                ) : (
                  <ul className="space-y-3">
                    {appsForJob.map((a) => {
                      const applicant = a.applicant || a.user || a.candidate || {};
                      const name = applicant.name || `${applicant.firstName || ""} ${applicant.lastName || ""}`.trim() || applicant.email || "Applicant";
                      const appliedAt = a.createdAt || a.appliedAt || a.date || null;
                      return (
                        <li key={String(a._id || a.id || Math.random())} className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm text-gray-700 overflow-hidden">
                              {applicant.avatar ? <img src={applicant.avatar} alt={name} className="w-full h-full object-cover" /> : (name[0] || "U")}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">{name}</div>
                              <div className="text-xs text-gray-500">{appliedAt ? new Date(appliedAt).toISOString().slice(0,10) : ""}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={`/company/application/${a._id || a.id || ""}`}
                              className="text-sm text-[#0B63F8] hover:underline"
                              onClick={(e) => {
                                /* in-app behavior: allow router to handle or prevent if necessary */
                              }}
                            >
                              Review
                            </a>

                            <button
                              className="text-sm px-2 py-1 border rounded text-gray-700"
                              onClick={() => window.open(applicant.resumeUrl || a.resumeUrl || "#", "_blank")}
                            >
                              Resume
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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

  // selected job for modal
  const [selectedJob, setSelectedJob] = useState(null);

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

        const jjson = await jr.json().catch(() => ({}));
        const ajson = await ar.json().catch(() => ({}));

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

  /* Partition: archived tab should contain ONLY jobs whose status includes 'archiv' */
  const partitioned = useMemo(() => {
    const active = [];
    const archived = [];

    for (const j of jobs) {
      const s = normalize(j.status || j.state || (j.isActive ? "open" : "closed"));
      const isArchivedStatus = s.includes("archiv"); // only status with 'archiv' counts
      (isArchivedStatus ? archived : active).push(j);
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
        (st === "closed" && status.includes("closed")) ||
        (st === "archived" && status.includes("archiv")) ||
        (st === "deleted" && status.includes("deleted")) ||
        (st === "suspended" && status.includes("suspend"));

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

  /* ---------- View handler (navigate to JobDetailPage) ---------- */
  const handleView = (jobOrId) => {
    const id = typeof jobOrId === "string" ? jobOrId : getJobId(jobOrId);
    if (!id) {
      setErr("Missing job id for view.");
      return;
    }
    setOpenMenuId(null);
    setSelectedJob(null);
    navigate(jobDetailPath(id));
  };

  /* ---------- Actions: delete (soft), edit, archive/unarchive, close/reopen ---------- */

  // Delete -> soft-delete (status: "deleted", isArchived: true)
  const handleDelete = async (jobOrId) => {
    const id = String(jobOrId._id || jobOrId.id || jobOrId);
    const ok = await confirmAction({ title: 'Delete this job?', text: 'This will mark it as deleted and archive it.', confirmText: 'Delete' });
    if (!ok) {
      setOpenMenuId(null);
      return;
    }

    setActionLoadingId(id);
    setErr("");
    // find job's current values
    const job = jobs.find((j) => String(j._id || j.id || j.slug || "") === id);
    const currentStatus = job?.status || (job?.isActive ? "open" : "closed");

    // optimistic update
    updateJobInState(id, { status: "deleted", isArchived: true });

    try {
      const res = await fetch(`${API.companyJobs}/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          ...authHeader(),
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.message || "Failed to delete job");
      }

      const data = await res.json().catch(() => null);
      if (data?.job) updateJobInState(id, data.job);
    } catch (e) {
      // revert
      updateJobInState(id, { status: currentStatus, isArchived: job?.isArchived || false });
      setErr(e.message || "Failed to delete job.");
    } finally {
      setActionLoadingId(null);
      setOpenMenuId(null);
      setSelectedJob(null);
    }
  };

  // Archive / Unarchive -> archive = status: "archived", isArchived: true
  const handleToggleArchive = async (jobOrId) => {
    const id = String(jobOrId._id || jobOrId.id || jobOrId);
    setActionLoadingId(id);
    setErr("");

    const job = jobs.find((j) => String(j._id || j.id || j.slug || "") === id);
    const currentStatus = job?.status || (job?.isActive ? "open" : "closed");
    const isCurrentlyArchived = normalize(currentStatus).includes("archiv");

    const newStatus = isCurrentlyArchived ? "open" : "archived";
    const payload = { status: newStatus, isArchived: !isCurrentlyArchived };

    // optimistic update
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

      const updated = await res.json().catch(() => null);
      if (updated) updateJobInState(id, updated);
    } catch (e) {
      // revert
      updateJobInState(id, { status: currentStatus, isArchived: job?.isArchived || false });
      setErr(e.message || "Failed to update job status.");
    } finally {
      setActionLoadingId(null);
      setOpenMenuId(null);
      setSelectedJob(null);
    }
  };

  // Close / Reopen -> closed <-> open, do NOT archive here
  const handleCloseOrReopen = async (jobOrId) => {
    const id = String(jobOrId._id || jobOrId.id || jobOrId);
    const job = jobs.find((j) => String(j._id || j.id || j.slug || "") === id);
    const isCurrentlyClosed = normalize((job?.status || (job?.isActive ? "open" : "closed"))).includes("closed");
    const ok = await confirmAction({ title: isCurrentlyClosed ? 'Reopen job?' : 'Close job?', text: isCurrentlyClosed ? 'Reopen this job listing?' : 'Close this job listing?', confirmText: isCurrentlyClosed ? 'Reopen' : 'Close' });
    if (!ok) return;
    setActionLoadingId(id);
    setErr("");

    const currentStatus = job?.status || (job?.isActive ? "open" : "closed");

    const newStatus = isCurrentlyClosed ? "open" : "closed";
    const payload = { status: newStatus, isArchived: false };

    // optimistic update
    updateJobInState(id, { status: newStatus, isArchived: false });

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

      const updated = await res.json().catch(() => null);
      if (updated) updateJobInState(id, updated);
    } catch (e) {
      // revert optimistic change
      updateJobInState(id, { status: currentStatus, isArchived: job?.isArchived || false });
      setErr(e.message || "Failed to update job status.");
    } finally {
      setActionLoadingId(null);
      setOpenMenuId(null);
      setSelectedJob(null);
    }
  };

  const handleEdit = (jobOrId) => {
    const id = String(jobOrId._id || jobOrId.id || jobOrId);
    setOpenMenuId(null);
    setSelectedJob(null);
    navigate(`/company/post-job/${id}`);
  };

  /* ---------- Render ---------- */
  return (
    <div className="bg-white rounded-2xl min-h-[calc(100vh-60px)]">
      <div className="max-w-[1200px] mx-auto py-6 px-3">
        {/* Top bar: title + create */}
        <div className="flex items-center justify-between mb-4">
          <div className=" mb-6">
          <h1 className="text-2xl font-semibold text-black">Job Postings</h1>
          <p className="text-sm font-medium text-gray-400">Manage and track your company’s active job listings.</p>
          </div>
          <button
            onClick={goCreate}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-[#F37526] font-medium text-white text-sm shadow-sm hover:bg-[#fd9b5f]"
          >
            <span className="text-base leading-none">＋</span> Post New Job
          </button>
        </div>

        {/* Filters row */}
        <div className="grid grid-cols-12 gap-3 items-center">
          <div className="col-span-5">
            <div className="flex items-center gap-2 rounded-lg border border-gray-400 bg-white px-3 py-2">
              <span className="text-gray-400"></span>
              <Search className="w-4 h-4 text-gray-400" aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                icon={Search}
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
              className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2 text-sm"
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
              className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="pending">Pending Review</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
              <option value="deleted">Deleted</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="col-span-3">
            <label className="sr-only">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2 text-sm"
            >
              <option value="date">Date Posted</option>
              <option value="title">Title (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Tabs bar */}
        <div className="mt-4 flex rounded-lg border border-gray-400 bg-white overflow-hidden">
          <button
            className={`flex-1 py-2 text-sm ${tab === "active" ? "text-white bg-blue-600 font-medium" : "text-gray-600"}`}
            onClick={() => setTab("active")}
          >
            Active Listings
          </button>
          <button
            className={`flex-1 py-3 text-sm ${tab === "archived" ? "text-white bg-blue-600 font-medium" : "text-gray-600"}`}
            onClick={() => setTab("archived")}
          >
            Archived Listings
          </button>
        </div>

        {/* Table */}
        <div className="mt-4 rounded-lg border border-gray-300 bg-white overflow-visible" ref={tableRef}>
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
                const isArchived = normalize(j.status || "").includes("archiv");

                return (
                  <li key={id} className="px-4 py-4 grid grid-cols-12 gap-3 items-center">
                    {/* Job Title + secondary line */}
                    <div className="col-span-4 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{j.title || "Untitled"}</p>
                      <p className="text-xs text-gray-500 mt-1">{loc || "—"}</p>
                    </div>

                    {/* Category pill */}
                    <div className="col-span-2">
                      <span className="inline-block font-semibold text-gray-700 text-xs px-3 py-1">
                        {dept}
                      </span>
                    </div>

                    {/* Status pill */}
                    <div className="col-span-2">
                      <span className={`inline-block rounded-full font-medium border text-xs px-3 py-1 ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>

                    {/* Date (NO time-ago) */}
                    <div className="col-span-2 text-sm font-medium text-gray-500">
                      {when ? new Date(when).toISOString().slice(0, 10) : "—"}
                    </div>

                    {/* Applications (bold number) */}
                    <div className="col-span-1 text-sm font-medium text-gray-500">
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
                        <div className="absolute right-0 top-9 w-48 rounded-md border bg-white shadow-md z-10">
                          <button
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                            onClick={() => handleView(j)}
                          >
                            View
                          </button>

                          <button
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                            onClick={() => handleEdit(j)}
                          >
                            Edit
                          </button>

                          <button
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                            onClick={() => handleToggleArchive(j)}
                            disabled={isActionLoading}
                          >
                            {isActionLoading ? "Updating…" : isArchived ? "Unarchive" : "Archive"}
                          </button>

                          <button
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                            onClick={() => handleCloseOrReopen(j)}
                            disabled={isActionLoading}
                          >
                            {isActionLoading ? "Updating…" : normalize(j.status || "").includes("closed") ? "Reopen" : "Close Job"}
                          </button>

                          <div className="h-px bg-gray-100" />
                          <button
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(j)}
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
            <span className="ml-3">{totalResults === 0 ? 0 : startIdx + 1}-{Math.min(startIdx + rowsPerPage, totalResults)} of {totalResults} results</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`px-3 py-1 rounded border text-sm ${currentPage <= 1 ? "text-gray-700 border-gray-200" : "text-gray-700 hover:bg-gray-50"}`}
            >
              Previous
            </button>

            {/* Simple page indicator (current) */}
            <span className="min-w-[28px] text-center px-2 py-1 rounded bg-blue-600 text-white text-sm">
              {currentPage}
            </span>

            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={`px-3 py-1 rounded border text-sm ${currentPage >= totalPages ? "text-gray-700 border-gray-200" : "text-gray-700 hover:bg-gray-50"}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Job detail modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          apps={apps}
          onClose={() => setSelectedJob(null)}
          onEdit={() => handleEdit(selectedJob)}
          onToggleArchive={() => handleToggleArchive(selectedJob)}
          onCloseReopen={() => handleCloseOrReopen(selectedJob)}
          onDelete={() => handleDelete(selectedJob)}
        />
      )}
    </div>
  );
}
