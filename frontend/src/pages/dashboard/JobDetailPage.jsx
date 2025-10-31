  // src/pages/company/JobDetailPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  MapPin,
  DollarSign,
  Briefcase,
  Clock,
  CalendarDays,
  Building2,
  Archive,
  Edit2,
} from "lucide-react";

/* -------------------------------------------------------
   API base + helpers
------------------------------------------------------- */
const API_BASE =
  (import.meta.env?.VITE_API_BASE ||
    (typeof window !== "undefined" && /:5173|:5174/.test(window.location.origin)
      ? "http://localhost:5000"
      : "")).replace(/\/+$/, "");

const api = (p) => (API_BASE ? `${API_BASE}${p}` : p);

const normalize = (v = "") => String(v).trim().toLowerCase().replace(/\s+/g, " ");

const getJobId = (job) =>
  String(job?._id?.$oid || job?._id || job?.id || job?.slug || "");

const PESO = "₱";

/* -------------------------------------------------------
   Small UI helpers
------------------------------------------------------- */
const timeAgo = (iso) => {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  const y = Math.floor(mo / 12);
  return `${y}y ago`;
};

const fmt = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const getInitials = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "U";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

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

const appStatusBadge = (raw) => {
  const s = normalize(raw);
  if (!s || s === "new" || s.includes("pending"))
    return { label: "New", cls: "bg-blue-50 text-blue-700 border-blue-200" };
  if (s.includes("review"))
    return { label: "Under Review", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  if (s.includes("accept") || s.includes("hire"))
    return { label: "Accepted", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (s.includes("reject"))
    return { label: "Rejected", cls: "bg-rose-50 text-rose-700 border-rose-200" };
  return { label: raw || "New", cls: "bg-gray-50 text-gray-700 border-gray-200" };
};

/* -------------------------------------------------------
   Page
------------------------------------------------------- */
export default function JobDetailPage({ token: propToken }) {
  const { id: routeId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  // prefer explicit prop token, else localStorage (company first)
  const token = useMemo(
    () =>
      propToken ||
      (typeof window !== "undefined" &&
        (localStorage.getItem("ic_company_token") || localStorage.getItem("ic_token"))) ||
      "",
    [propToken]
  );
  const authHeader = () => (token ? { Authorization: `Bearer ${token}` } : {});

  // if we got here by clicking "View", we may already have the job
  const [job, setJob] = useState(state?.job || null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(!state?.job);
  const [err, setErr] = useState("");
  const [busyAction, setBusyAction] = useState(false);

  /* ---------- Fetch job (with plural/singular/public fallbacks) ---------- */
  async function fetchJobById(jobId) {
    const attempts = [
      api(`/api/company/jobs/${encodeURIComponent(jobId)}`), // plural
      api(`/api/company/job/${encodeURIComponent(jobId)}`),  // singular
      api(`/api/jobs/${encodeURIComponent(jobId)}`),         // public/alt
    ];
    let lastErr = "Not found";
    for (const url of attempts) {
      try {
        const r = await fetch(url, { credentials: "include", headers: { ...authHeader() } });
        const j = await r.json().catch(() => ({}));
        if (r.ok && (j?.job || j?._id || j?.id)) {
          return j.job || j;
        }
        lastErr = j?.message || `${r.status} ${r.statusText}`;
      } catch (e) {
        lastErr = e.message || "Network error";
      }
    }
    throw new Error(lastErr || "Not found");
  }

  /* ---------- Load job + applications ---------- */
  useEffect(() => {
    let ignore = false;
    const ctrl = new AbortController();

    (async () => {
      try {
        setErr("");
        if (!job) setLoading(true);

        const jobId = getJobId(job) || routeId;
        if (!jobId) throw new Error("Missing job id");

        // refresh the job (keeps UI up to date if status changed)
        const fresh = await fetchJobById(jobId);
        if (!ignore) setJob(fresh);

        // fetch all applications, then filter by job
        const ar = await fetch(api(`/api/company/applications`), {
          credentials: "include",
          headers: { ...authHeader() },
          signal: ctrl.signal,
        });
        const ajson = await ar.json().catch(() => ({}));
        if (!ar.ok) throw new Error(ajson?.message || "Failed to load applicants");

        const list = Array.isArray(ajson) ? ajson : ajson?.items || ajson?.applications || [];
        const filtered = list.filter((a) => {
          const jid = String(
            a?.job?._id?.$oid ||
              a?.job?._id ||
              a?.jobId ||
              a?.job ||
              ""
          );
          return jid === getJobId(fresh);
        });

        if (!ignore) setApps(filtered);
      } catch (e) {
        if (!ignore) setErr(e.message || "Failed to load job details.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  /* ---------- Actions ---------- */
  const doArchiveToggle = async () => {
    if (!job) return;
    const isArchived = normalize(job.status || "").includes("archiv");
    const next = isArchived ? "open" : "archived";
    const payload = { status: next, isArchived: !isArchived };

    setBusyAction(true);
    setErr("");
    const id = getJobId(job);
    const prev = job;

    // optimistic
    setJob((j) => ({ ...j, ...payload }));

    try {
      const attempts = [
        api(`/api/company/jobs/${encodeURIComponent(id)}`),
        api(`/api/company/job/${encodeURIComponent(id)}`),
        api(`/api/jobs/${encodeURIComponent(id)}`),
      ];
      let ok = false;
      let updated = null;

      for (const url of attempts) {
        const res = await fetch(url, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(() => ({}));
        if (res.ok) {
          updated = j.job || j;
          ok = true;
          break;
        }
      }
      if (!ok) throw new Error("Failed to update job");
      if (updated) setJob(updated);
    } catch (e) {
      setJob(prev); // revert
      setErr(e.message || "Failed to update job.");
    } finally {
      setBusyAction(false);
    }
  };

  const goEdit = () => {
    if (!job) return;
    const id = getJobId(job);
    // pass the full job so PostJob can prefill instantly
    navigate(`/company/post-job/${id}`, { state: { job } });
  };

  /* ---------- Derived UI bits ---------- */
  const headerMeta = useMemo(() => {
    const location = job?.location || job?.city || "Remote / —";
    const salaryMax =
      job?.salaryMax ??
      (job?.salaryRange || job?.salary || "");
    const employmentType = job?.jobType || job?.type || job?.employmentType || "";
    const workType = job?.workType || job?.mode || job?.workArrangement || job?.locationType || "";
    const posted = job?.createdAt || job?.datePosted || "";
    const dept = job?.department || job?.category || job?.categoryName || "";
    const st = statusBadge(job?.status || (job?.isActive ? "Open" : "Closed"));

    return {
      location,
      salaryMax,
      employmentType,
      workType,
      postedAgo: posted ? timeAgo(posted) : "—",
      postedOn: posted ? fmt(posted) : "",
      dept,
      status: st,
    };
  }, [job]);

  /* ---------- Render ---------- */
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6">
        <div className="h-8 w-64 bg-gray-100 rounded mb-4" />
        <div className="h-6 w-96 bg-gray-100 rounded mb-2" />
        <div className="h-6 w-80 bg-gray-100 rounded mb-8" />
        <div className="h-40 bg-gray-100 rounded mb-4" />
        <div className="h-40 bg-gray-100 rounded" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="bg-white rounded-2xl p-6">
        <div className="px-4 py-3 rounded-lg border border-red-200 text-red-600 bg-red-50 inline-block">
          {err}
        </div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="bg-white rounded-2xl max-w-[1150px] mx-auto">
      {/* Header */}
      <div className="px-6 pt-5">
        <h1 className="text-2xl font-semibold text-[#173B8A]">
          {job.title || "Untitled Job"}
        </h1>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 mt-2">
          <div className="inline-flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            <span>{headerMeta.location}</span>
          </div>

          {!!headerMeta.salaryMax && (
            <div className="inline-flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              <span>
                {String(headerMeta.salaryMax).match(/^\d+$/)
                  ? `${PESO}${headerMeta.salaryMax}`
                  : String(headerMeta.salaryMax)}
              </span>
            </div>
          )}

          {!!headerMeta.employmentType && (
            <div className="inline-flex items-center gap-1.5">
              <Briefcase className="w-4 h-4" />
              <span>{headerMeta.employmentType}</span>
            </div>
          )}

          <div className="inline-flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>Posted {headerMeta.postedAgo}</span>
          </div>

          {!!headerMeta.workType && (
            <div className="inline-flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              <span>{headerMeta.workType}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={goEdit}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border hover:bg-gray-50"
          >
            <Edit2 className="w-4 h-4" />
            Edit job
          </button>

          <button
            disabled={busyAction}
            onClick={doArchiveToggle}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border hover:bg-gray-50"
          >
            <Archive className="w-4 h-4" />
            {normalize(job.status || "").includes("archiv") ? "Unarchive job" : "Archive job"}
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="mt-4 border-t border-gray-200" />

      {/* Quick facts */}
      <div className="px-6 pt-5 pb-2">
        <div className="flex flex-wrap gap-3 text-sm text-gray-700">
          <Fact label="Department" value={headerMeta.dept || "—"} />
          <Fact label="Work Type" value={headerMeta.workType || "—"} />
          <Fact label="Employment" value={headerMeta.employmentType || "—"} />
          <Fact
            label="Status"
            value={
              <span className={`inline-block rounded-full border text-xs px-2.5 py-0.5 ${headerMeta.status.cls}`}>
                {headerMeta.status.label}
              </span>
            }
          />
          <Fact label="Posted on" value={headerMeta.postedOn || "—"} />
          <Fact
            label="Start (from)"
            value={fmt(job.startDateRange?.from || job.startDateFrom) || "—"}
            icon={<CalendarDays className="w-3.5 h-3.5" />}
          />
          <Fact
            label="Start (to)"
            value={fmt(job.startDateRange?.to || job.startDateTo) || "—"}
            icon={<CalendarDays className="w-3.5 h-3.5" />}
          />
          <Fact
            label="Deadline"
            value={fmt(job.applicationDeadline || job.deadline) || "—"}
            icon={<CalendarDays className="w-3.5 h-3.5" />}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-8">
        {/* Job Description */}
        <section>
          <h2 className="text-base font-semibold text-gray-800">Job Description</h2>

          {/* About the Role */}
          <div className="mt-4">
            <h3 className="font-medium text-gray-800">About the Role</h3>
            <div className="prose prose-sm max-w-none text-gray-700 mt-2">
              {job.about ? (
                <p>{job.about}</p>
              ) : (
                <div
                  className="leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html:
                      job.description ||
                      job.shortDescription ||
                      "<p>No description provided.</p>",
                  }}
                />
              )}
            </div>
          </div>

          {/* Key Responsibilities */}
          <div className="mt-6">
            <h3 className="font-medium text-gray-800">Key Responsibilities</h3>
            <ul className="mt-2 list-disc list-inside text-sm text-gray-700 space-y-1">
              {(Array.isArray(job.responsibilities) ? job.responsibilities : [])
                .map((r, i) => <li key={i}>{r}</li>)}
              {!job.responsibilities?.length && job.description && (
                <li>See description above.</li>
              )}
            </ul>
          </div>

          {/* What we offer */}
          {!!(job.offers?.length) && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-800">What We Offer</h3>
              <ul className="mt-2 list-disc list-inside text-sm text-gray-700 space-y-1">
                {job.offers.map((o, i) => <li key={`offer-${i}`}>{o}</li>)}
              </ul>
            </div>
          )}
        </section>

        {/* Requirements */}
        <section>
          <h2 className="text-base font-semibold text-gray-800">Requirements</h2>

          {/* Skills pills */}
          <div className="mt-3">
            <h5 className="text-sm font-semibold text-gray-900 mb-2">Required Skills</h5>
            {Array.isArray(job.skills) && job.skills.length ? (
              <div className="flex flex-wrap gap-2">
                {job.skills.map((s, i) => (
                  <span
                    key={`skill-${i}`}
                    className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-800"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">—</p>
            )}
          </div>

          {/* Education, languages, level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm text-gray-800">
            <Meta label="Education Level" value={Array.isArray(job.educationLevel) && job.educationLevel.length ? job.educationLevel.join(", ") : "—"} />
            <Meta label="Languages" value={
              Array.isArray(job.languages) && job.languages.length
                ? job.languages.join(", ")
                : (typeof job.languages === "string" && job.languages) || "—"
            } />
            <Meta label="Experience Level" value={
              job.experienceLevel === "Entry" ? "Entry-level (0–2 yrs)"
              : job.experienceLevel === "Mid" ? "Mid-level (3–5 yrs)"
              : job.experienceLevel === "Senior" ? "Senior-level (6+ yrs)"
              : job.experienceLevel || "—"
            } />
          </div>

          {/* Other requirements list */}
          <div className="mt-4">
            <h5 className="text-sm font-semibold text-gray-900 mb-2">Other Requirements</h5>
            {Array.isArray(job.requirements) && job.requirements.length ? (
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
                {job.requirements.map((x, i) => <li key={`req-${i}`}>{x}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">—</p>
            )}
          </div>

          {/* Screening Questions */}
          <div className="mt-4">
            <h5 className="text-sm font-semibold text-gray-900 mb-2">Screening Questions</h5>
            {Array.isArray(job.screeningQuestions) && job.screeningQuestions.length ? (
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
                {job.screeningQuestions.map((x, i) => <li key={`sq-${i}`}>{x}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">—</p>
            )}
          </div>
        </section>

        {/* Applicants */}
        <section>
          <h2 className="text-base font-semibold text-gray-800">Applicants</h2>

          <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
            {/* Head */}
            <div className="grid grid-cols-12 gap-3 px-4 py-3 text-xs font-semibold text-gray-600 bg-[#F6F7FA]">
              <div className="col-span-5">Applicant Name</div>
              <div className="col-span-3">Application Status</div>
              <div className="col-span-2">Date Applied</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Rows */}
            {apps.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-600">No applicants yet.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {apps.map((a) => {
                  const id = String(a._id || a.id || Math.random());
                  const person = a.student || a.applicant || a.user || a.candidate || {};
                  const name =
                    person.fullName ||
                    person.name ||
                    `${person.firstName || ""} ${person.lastName || ""}`.trim() ||
                    person.email ||
                    "Applicant";
                  const status = appStatusBadge(a.status || a.state || a.stage || "New");
                  const created = a.createdAt || a.appliedAt || a.date || "";
                  const reviewHref = `/company/applications?job=${encodeURIComponent(
                    getJobId(job)
                  )}&app=${encodeURIComponent(id)}`;

                  return (
                    <li key={id} className="grid grid-cols-12 gap-3 items-center px-4 py-3">
                      <div className="col-span-5 flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm text-gray-700 overflow-hidden">
                          {person.profilePicture ? (
                            <img src={person.profilePicture} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(name)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{name}</div>
                          {person.email && <div className="text-xs text-gray-500 truncate">{person.email}</div>}
                        </div>
                      </div>

                      <div className="col-span-3">
                        <span className={`inline-block rounded-full border text-xs px-3 py-1 ${status.cls}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="col-span-2 text-sm text-gray-900">
                        {created ? new Date(created).toISOString().slice(0, 10) : "—"}
                      </div>

                      <div className="col-span-2 flex justify-end gap-2">
                        <a href={reviewHref} className="text-sm text-[#0B63F8] hover:underline">
                          Review
                        </a>
                        {(person.resumeUrl || a.resumeUrl) && (
                          <button
                            className="text-sm px-2 py-1 border rounded text-gray-700"
                            onClick={() => window.open(person.resumeUrl || a.resumeUrl, "_blank")}
                          >
                            Resume
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* -------------------------------------------
   Tiny presentational helpers
------------------------------------------- */
function Fact({ label, value, icon }) {
  return (
    <div className="inline-flex items-center gap-2 mr-4 mb-2">
      {icon}
      <span className="text-gray-500">{label}:</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value || "—"}</span>
    </div>
  );
}
