// src/pages/ApplicationsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

/* -------------------------------------------------------
   API base resolver (env first, fallback for Vite dev)
------------------------------------------------------- */
const RAW_API_BASE =
  (import.meta.env?.VITE_API_BASE ||
    (typeof window !== "undefined" && /:5173|:5174/.test(window.location.origin)
      ? "http://localhost:5000"
      : "")).trim();

const api = (p) => (RAW_API_BASE ? `${RAW_API_BASE}${p}` : p);

/* ------------------------------
 * API endpoints (company side)
 * ------------------------------ */
const API = {
  listApplications: api("/api/company/applications"),
  reviewApplication: (id) => api(`/api/applications/${id}`),
  studentProfile: (studentId) => api(`/api/students/${studentId}/profile`),
  screeningAnswers: (appId) => api(`/api/applications/${appId}/screening-answers`),
  applicantMessage: (appId) => api(`/api/applications/${appId}/message`),
};

/* ------------------------------
 * Small helpers
 * ------------------------------ */
const timeAgo = (iso) => {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const Initials = ({ name = "" }) => {
  const parts = String(name).trim().split(/\s+/).slice(0, 2);
  const ini = parts.map((p) => p[0]?.toUpperCase() || "").join("");
  return (
    <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
      {ini || "?"}
    </div>
  );
};

/* ------------------------------
 * Details Drawer
 * ------------------------------ */
function ReviewDrawer({ open, onClose, applicant }) {
  if (!open || !applicant) return null;

  const { student, job, resume, answers, message } = applicant;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-xl border-l rounded-none sm:rounded-l-2xl p-6 overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold">Review Application</h3>
            <p className="text-gray-600 text-sm">
              {student?.fullName} · {job?.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <section className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">Resume</h4>
            {resume?.url ? (
              <a
                href={resume.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Open Resume
              </a>
            ) : resume?.text ? (
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 border rounded-lg p-3">
                {resume.text}
              </pre>
            ) : (
              <p className="text-gray-600 text-sm">No resume provided.</p>
            )}
          </div>

          <div>
            <h4 className="font-medium mb-2">Screening Answers</h4>
            {answers?.length ? (
              <ul className="space-y-3">
                {answers.map((a, idx) => (
                  <li key={idx} className="border rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">
                      Q{idx + 1}{a?.question ? `: ${a.question}` : ""}
                    </p>
                    <p className="text-sm text-gray-700">{a?.answer || "—"}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 text-sm">No answers found.</p>
            )}
          </div>

          <div>
            <h4 className="font-medium mb-2">Applicant Message</h4>
            {message ? (
              <div className="border rounded-lg p-3 text-sm text-gray-800 whitespace-pre-wrap">
                {message}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">No message provided.</p>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}

/* ------------------------------
 * Main Page
 * ------------------------------ */
export default function ApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rowBusy, setRowBusy] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  const authHeader = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("ic_token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(API.listApplications, {
        credentials: "include",
        headers: { ...authHeader() },
      });
      if (!res.ok) throw new Error(`Failed to load applications`);
      const data = await res.json();

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.applications)
        ? data.applications
        : data?.items || [];

      setApps(items.map((a) => ({ ...a, status: a.status || "Application Sent" })));
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const statusLabel = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "accepted") return ["Accepted", "bg-green-100 text-green-700"];
    if (s === "rejected") return ["Rejected", "bg-red-100 text-red-700"];
    if (s === "new") return ["Under Review", "bg-yellow-100 text-yellow-800"];
    return ["Application Sent", "bg-gray-100 text-gray-700"];
  };

  const handleReview = async (app) => {
    if (!app?._id) return;
    setRowBusy(app._id);
    setError(null);
    try {
      const res = await fetch(API.reviewApplication(app._id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        credentials: "include",
        body: JSON.stringify({ status: "New" }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setApps((prev) => prev.map((x) => (x._id === app._id ? { ...x, status: "New" } : x)));

      const [profileRes, answersRes, msgRes] = await Promise.all([
        fetch(API.studentProfile(app.student?._id), { credentials: "include", headers: { ...authHeader() } }),
        fetch(API.screeningAnswers(app._id), { credentials: "include", headers: { ...authHeader() } }),
        fetch(API.applicantMessage(app._id), { credentials: "include", headers: { ...authHeader() } }),
      ]);

      const profile = profileRes.ok ? await profileRes.json() : null;
      const answersRaw = answersRes.ok ? await answersRes.json() : [];
      const messageRaw = msgRes.ok ? await msgRes.json() : null;

      let resume = null;
      if (app.resume) {
        resume = { url: api(`/uploads/resumes/${encodeURIComponent(app.resume)}`) };
      } else if (profile?.resumeUrl) {
        resume = { url: profile.resumeUrl };
      } else if (profile?.resumeText) {
        resume = { text: profile.resumeText };
      }

      setSelected({
        id: app._id,
        student: {
          id: app.student?._id,
          fullName:
            app.student?.fullName ||
            [app.student?.firstName, app.student?.lastName].filter(Boolean).join(" "),
        },
        job: { id: app.job?._id, title: app.job?.title },
        resume,
        answers: Array.isArray(answersRaw) ? answersRaw : answersRaw?.items || [],
        message: typeof messageRaw === "string" ? messageRaw : messageRaw?.text || "",
      });
      setDrawerOpen(true);
    } catch (e) {
      setError(e.message || "Unable to review application.");
    } finally {
      setRowBusy(null);
    }
  };

  const rows = useMemo(() => apps, [apps]);

  return (
    // page wrapper – transparent (no card background)
    <section className="max-w-6xl mx-auto px-4 sm:px-6 bg-transparent">
      {/* Title exactly like screenshot */}
      <h1 className="text-4xl font-bold text-[#0B2E82] mb-6">Applications</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-600">Loading applications…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-600">No applications yet.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((app) => {
            const fullName =
              app.student?.fullName ||
              [app.student?.firstName, app.student?.lastName].filter(Boolean).join(" ") ||
              "Unknown Applicant";
            const jobTitle = app.job?.title || "—";
            const [label, pillClass] = statusLabel(app.status);
            const isBusy = rowBusy === app._id;

            return (
              <li
                  key={app._id}
                  className="relative rounded-xl bg-white p-5 shadow-lg hover:shadow-xl transition-shadow flex items-start gap-4 min-h-[140px]"
                >
                  {/* Top-right status pill */}
                  <span
                    className={`absolute top-4 right-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${pillClass}`}
                    title={`Status: ${app.status || "Application Sent"}`}
                  >
                    {label}
                  </span>

                  {/* Bottom-right buttons */}
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <Link
                      to={`/students/${app.student?._id || ""}`}
                      className="px-3 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
                    >
                      View Profile
                    </Link>
                    <button
                      disabled={isBusy}
                      onClick={() => handleReview(app)}
                      className="px-4 py-2 rounded-lg bg-[#1337B6] text-white hover:bg-[#0F2FA0] disabled:opacity-60"
                    >
                      {isBusy ? "Updating…" : "Review Application"}
                    </button>
                  </div>

                  {/* Avatar */}
                  <Initials name={fullName} />

                  {/* Content column (top-left name/title, bottom-left time) */}
                  <div className="flex-1 min-w-0 pr-56"> {/* pr-56 keeps clear of right-side buttons/pill */}
                    <div className="flex flex-col h-full">
                      {/* Top-left: name + job title */}
                      <div>
                        <p className="text-lg font-semibold text-gray-900 truncate">{fullName}</p>
                        <p className="text-gray-600 text-sm">{jobTitle}</p>
                      </div>

                      {/* Bottom-left: time ago */}
                      <p className="mt-8 text-gray-500 text-xs">
                        Applied {timeAgo(app.appliedAt || app.createdAt)}
                      </p>
                    </div>
                  </div>
                </li>


            );
          })}
        </ul>
      )}

      <ReviewDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        applicant={selected}
      />
    </section>
  );
}

