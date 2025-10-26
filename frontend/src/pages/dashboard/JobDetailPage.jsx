// src/pages/dashboard/JobDetailPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

/* -------------------------------------------------------
   API base resolver (same logic as JobPostingsPage)
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

const normalize = (v = "") => String(v).trim().toLowerCase().replace(/\s+/g, " ");

const statusBadge = (raw) => {
  const s = normalize(raw);
  if (s.includes("deleted"))
    return { label: "Deleted", cls: "bg-red-50 text-red-700 border-red-200" };
  if (s.includes("archiv"))
    return { label: "Archived", cls: "bg-gray-50 text-gray-700 border-gray-200" };
  if (s.includes("suspend"))
    return { label: "Suspended", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  if (s.includes("pending"))
    return { label: "Pending Review", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  if (s.includes("closed"))
    return { label: "Closed", cls: "bg-red-50 text-red-700 border-red-200" };
  return { label: "Open", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
};

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const authHeader = () => {
    const token =
      (typeof window !== "undefined" && localStorage.getItem("ic_company_token")) ||
      (typeof window !== "undefined" && localStorage.getItem("ic_token")) ||
      null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        // Fetch job
        const jobRes = await fetch(`${API.companyJobs}/${id}`, {
          credentials: "include",
          headers: { ...authHeader() },
        });
        const jobJson = await jobRes.json().catch(() => ({}));
        if (!jobRes.ok) throw new Error(jobJson?.message || "Failed to load job");

        // Fetch applications filtered by jobId (if backend supports query param).
        // If your backend uses a different query param, adjust accordingly.
        const appsRes = await fetch(`${API.companyApps}?jobId=${encodeURIComponent(id)}`, {
          credentials: "include",
          headers: { ...authHeader() },
        });
        const appsJson = await appsRes.json().catch(() => ({}));
        if (!appsRes.ok) {
          // backend might return 200 even if no apps; but if error, we still show job
          console.warn("Failed to load apps", appsJson);
        }

        if (!cancelled) {
          setJob(jobJson?.job || jobJson); // some APIs return { job }
          // appsJson might be [] or { items: [...] } or { applications: [...] }
          const appsList = Array.isArray(appsJson) ? appsJson : appsJson?.items || appsJson?.applications || [];
          setApps(appsList);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load job details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const st = useMemo(() => statusBadge(job?.status || (job?.isActive ? "Open" : "Closed")), [job]);

  /* ---------- Local optimistic updates + server calls (same semantics as listing page) ---------- */
  const updateJobLocal = (patch) => setJob((j) => (j ? { ...j, ...patch } : j));

  const handleDelete = async () => {
    if (!job) return;
    const ok = window.confirm("Delete this job? This will mark it as deleted and archive it.");
    if (!ok) return;

    const jobId = String(job._id || job.id || job.slug || "");
    setActionLoadingId(jobId);
    setErr("");

    const currentStatus = job?.status || (job?.isActive ? "open" : "closed");
    updateJobLocal({ status: "deleted", isArchived: true });

    try {
      const res = await fetch(`${API.companyJobs}/${jobId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { ...authHeader() },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "Failed to delete job");
      }
      const data = await res.json().catch(() => null);
      if (data?.job) setJob(data.job);
      else {
        // best-effort: fetch job again (or navigate back)
        navigate("/company/jobs");
      }
    } catch (e) {
      updateJobLocal({ status: currentStatus, isArchived: job?.isArchived || false });
      setErr(e.message || "Failed to delete job");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleArchive = async () => {
    if (!job) return;
    const jobId = String(job._id || job.id || job.slug || "");
    setActionLoadingId(jobId);
    setErr("");

    const currentStatus = job?.status || (job?.isActive ? "open" : "closed");
    const isCurrentlyArchived = normalize(currentStatus).includes("archiv");
    const newStatus = isCurrentlyArchived ? "open" : "archived";
    const payload = { status: newStatus, isArchived: !isCurrentlyArchived };

    updateJobLocal({ status: newStatus, isArchived: payload.isArchived });

    try {
      const res = await fetch(`${API.companyJobs}/${jobId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "Failed to update job status");
      }
      const updated = await res.json().catch(() => null);
      if (updated) setJob(updated);
    } catch (e) {
      updateJobLocal({ status: currentStatus, isArchived: job?.isArchived || false });
      setErr(e.message || "Failed to update job status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCloseOrReopen = async () => {
    if (!job) return;
    const jobId = String(job._id || job.id || job.slug || "");
    setActionLoadingId(jobId);
    setErr("");

    const currentStatus = job?.status || (job?.isActive ? "open" : "closed");
    const isCurrentlyClosed = normalize(currentStatus).includes("closed");
    const newStatus = isCurrentlyClosed ? "open" : "closed";
    const payload = { status: newStatus, isArchived: false };

    updateJobLocal({ status: newStatus, isArchived: false });

    try {
      const res = await fetch(`${API.companyJobs}/${jobId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "Failed to update job status");
      }
      const updated = await res.json().catch(() => null);
      if (updated) setJob(updated);
    } catch (e) {
      updateJobLocal({ status: currentStatus, isArchived: job?.isArchived || false });
      setErr(e.message || "Failed to update job status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEdit = () => {
    if (!job) return;
    const jobId = String(job._id || job.id || job.slug || "");
    navigate(`/company/post-job/${jobId}`);
  };

  /* ---------- Rendering ---------- */
  if (loading) {
    return (
      <div className="max-w-[1150px] mx-auto py-6">
        <div className="h-20 bg-gray-100 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-40 bg-gray-100 rounded" />
          <div className="h-20 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-[1150px] mx-auto py-6">
        <div className="text-red-600">Job not found.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl min-h-[calc(100vh-60px)]">
      <div className="max-w-[1150px] mx-auto py-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <div className="mt-2 text-sm text-gray-600 flex items-center gap-3">
              <span>{job.location || job.city || "Remote"}</span>
              <span>•</span>
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs`}>
                <span className={`${st.cls} inline-block rounded-full px-2 py-0.5 text-xs`}>{st.label}</span>
              </span>
              {job.salary && (
                <>
                  <span>•</span>
                  <span>{job.salary}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleEdit} className="px-3 py-2 rounded-lg bg-[#0B63F8] text-white">Edit Job</button>
            <button onClick={handleToggleArchive} className="px-3 py-2 rounded-lg border">Archive Job</button>
            <button onClick={handleCloseOrReopen} className="px-3 py-2 rounded-lg border">Close / Reopen</button>
            <button onClick={handleDelete} className="px-3 py-2 rounded-lg border text-red-600">Delete</button>
          </div>
        </div>

        {/* Error */}
        {err && <div className="text-sm text-red-600 mb-4">{err}</div>}

        {/* Description & Requirements */}
        <div className="space-y-4">
          <section className="rounded-lg border p-4 bg-white">
            <h3 className="font-semibold mb-2">Job Description</h3>
            <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: job.description || job.shortDescription || "<p>No description provided.</p>" }} />
          </section>

          <section className="rounded-lg border p-4 bg-white">
            <h3 className="font-semibold mb-2">Requirements</h3>
            <ul className="list-disc list-inside text-sm text-gray-700">
              {(job.requirements && Array.isArray(job.requirements) ? job.requirements : (job.requirements ? [job.requirements] : []))
                .map((r, i) => <li key={i}>{r}</li>)}
              {!job.requirements && (
                <>
                  {job.skills && Array.isArray(job.skills) && job.skills.map((s, idx) => <li key={`s${idx}`}>{s}</li>)}
                  {!job.skills && <li>No specific requirements listed.</li>}
                </>
              )}
            </ul>
          </section>
        </div>

        {/* Applicants table */}
        <div className="mt-6 rounded-lg border bg-white">
          <div className="px-4 py-3 text-sm font-semibold text-gray-600 bg-[#F6F7FA]">Applicants</div>

          <div>
            {apps.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-600">No applicants yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-4 py-3">Applicant Name</th>
                    <th className="px-4 py-3">Application Status</th>
                    <th className="px-4 py-3">Date Applied</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => {
                    const applicant = a.applicant || a.user || a.candidate || {};
                    const name = applicant.name || `${applicant.firstName || ""} ${applicant.lastName || ""}`.trim() || applicant.email || "Applicant";
                    const appliedAt = a.createdAt || a.appliedAt || a.date || null;
                    const statusLabel = a.status || a.applicationStatus || "New";
                    return (
                      <tr key={String(a._id || a.id || Math.random())} className="border-t">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden text-sm">
                              {applicant.avatar ? <img src={applicant.avatar} alt={name} className="w-full h-full object-cover" /> : (name[0] || "U")}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{name}</div>
                              <div className="text-xs text-gray-500">{applicant.email || ""}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-full px-3 py-1 text-xs border ${normalize(statusLabel).includes("review") ? "bg-amber-50 text-amber-700" : normalize(statusLabel).includes("hired") ? "bg-emerald-50 text-emerald-700" : normalize(statusLabel).includes("rejected") ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-700"}`}>
                            {statusLabel}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-600">{appliedAt ? new Date(appliedAt).toISOString().slice(0,10) : "—"}</td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <button
                              className="text-sm text-[#0B63F8] hover:underline"
                              onClick={() => navigate(`/company/application/${a._id || a.id || ""}`)}
                            >
                              Review
                            </button>

                            <button
                              className="text-sm px-2 py-1 border rounded"
                              onClick={() => window.open(applicant.resumeUrl || a.resumeUrl || "#", "_blank")}
                            >
                              Resume
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
