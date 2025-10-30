// src/components/dashboard/ReviewApplicationModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

/* Resolve API base (env first, Vite dev fallback) */
const RAW_API_BASE =
  (import.meta.env?.VITE_API_BASE ||
    (typeof window !== "undefined" &&
    /:5173|:5174/.test(window.location.origin)
      ? "http://localhost:5000"
      : "")).trim();
const api = (p) => (RAW_API_BASE ? `${RAW_API_BASE}${p}` : p);

function Initials({ name = "" }) {
  const n = String(name).trim();
  const parts = n ? n.split(/\s+/).slice(0, 2) : [];
  const ini = parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return (
    <div className="h-12 w-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
      {ini || "?"}
    </div>
  );
}

export default function ReviewApplicationModal({
  open,
  onClose,
  application,            // optional seed object
  applicationId,          // optional if `application` has id/_id
  onStatusChange,         // (status, id) => void
}) {
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(Boolean(open));
  const [err, setErr] = useState("");

  // prefer company token on company pages
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("ic_company_token") ||
        localStorage.getItem("ic_token")
      : null;

  const authHeader = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const id =
    application?.id ||
    application?._id ||
    applicationId;

  /* Fetch the full application (student + skills + answers + message).
     If answers/skills are missing, fetch job screening and/or student profile. */
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!open || !id) return;
      setLoading(true);
      setErr("");
      try {
        // unified payload
        const res = await fetch(api(`/api/company/applications/${id}`), {
          headers: { ...authHeader },
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load application");

        let next = data;

        // Fallback: if skills are empty, try student profile
        if ((!next?.student?.skills || next.student.skills.length === 0) && next?.student?._id) {
          try {
            const p = await fetch(api(`/api/students/${next.student._id}/profile`), {
              headers: { ...authHeader },
              credentials: "include",
            });
            if (p.ok) {
              const prof = await p.json();
              next = {
                ...next,
                student: {
                  ...next.student,
                  skills: Array.isArray(prof?.skills) ? prof.skills : next.student.skills || [],
                  // if your profile returns `school`, add it too
                  school: prof?.school || next.student.school || "",
                },
              };
            }
          } catch {}
        }

        // Fallback: if answers missing, try job screening questions
        if ((!next?.answers || next.answers.length === 0) && next?.job?._id) {
          try {
            const q = await fetch(api(`/api/jobs/${next.job._id}/screening`), {
              headers: { ...authHeader },
              credentials: "include",
            });
            if (q.ok) {
              const qs = await q.json();
              const questions = Array.isArray(qs?.questions) ? qs.questions : [];
              next = { ...next, answers: questions.map((qq) => ({ question: qq, answer: "" })) };
            }
          } catch {}
        }

        if (!ignore) setApp(next);
      } catch (e) {
        if (!ignore) setErr(e.message || "Failed to load application");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id]);

  if (!open) return null;

  // graceful UI with skeletons
  const student = app?.student || {};
  const fullName =
    student.fullName ||
    [student.firstName, student.lastName].filter(Boolean).join(" ");
  const courseAndSchool = [student.course, student.school].filter(Boolean).join(", ");
  const skills = Array.isArray(student.skills) ? student.skills : [];
  const answers = Array.isArray(app?.answers) ? app.answers : [];
  const message = app?.message || "";

  const handleAccept = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You want to accept this application?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, accept it!",
    }).then((result) => {
      if (result.isConfirmed && app) {
        onStatusChange?.("Accepted", app._id || app.id);
        toast.success("Applicant accepted successfully!");
      }
    });
  };

  const handleReject = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You want to reject this application?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, reject it!",
    }).then((result) => {
      if (result.isConfirmed && app) {
        onStatusChange?.("Rejected", app._id || app.id);
        toast.error("Applicant rejected.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl mt-10 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b relative">
          <div className="min-w-0 pr-10">
            <h3 className="font-semibold text-gray-900 truncate">
              Review Application: {fullName || "—"}
            </h3>
            <p className="text-xs text-gray-500">
              Details and screening answers for the student’s application.
            </p>
          </div>

          {/* X close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">
          {err && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {err}
            </div>
          )}

          {/* Top row: avatar + name/subtitle + right-aligned View Resume */}
          <div className="flex items-center justify-between gap-4">
            {/* Left: avatar + name + subtitle + skills */}
            <div className="flex items-start gap-4 min-w-0 flex-1">
              {student.profilePicture ? (
                <img
                  src={student.profilePicture}
                  alt={fullName}
                  className="h-12 w-12 rounded-full object-cover border"
                />
              ) : (
                <Initials name={fullName} />
              )}

              <div className="min-w-0 flex-1">
                <div className="font-semibold text-gray-900 truncate">
                  {fullName || "—"}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {courseAndSchool || "—"}
                </div>

                {!!skills.length && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {skills.map((s, i) => (
                      <span
                        key={`${s}-${i}`}
                        className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700 border"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: View Resume (aligned with profile) */}
            {app?.resume && (
              <a
                href={api(`/uploads/resumes/${encodeURIComponent(app.resume)}`)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-md bg-[#1E6FBF] hover:bg-[#175C9E] text-white text-sm font-medium shadow shrink-0"
              >
                View Resume
              </a>
            )}
          </div>

          {/* Bio */}
          <div className="mt-6">
            <div className="text-sm font-semibold text-gray-800 mb-1">Bio</div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">
              {student.bio?.trim() || "No bio added yet"}
            </p>
          </div>

          {/* Screening Questions */}
          <div className="mt-6">
            <div className="text-sm font-semibold text-gray-800 mb-2">
              Screening Questions
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            ) : answers.length ? (
              <ul className="space-y-3">
                {answers.map((a, i) => (
                  <li key={i} className="rounded-lg border bg-white">
                    <div className="px-3 pt-3 text-sm text-gray-700">
                      <span className="font-medium">{
                        a?.question || `Question ${i + 1}`
                      }</span>
                    </div>
                    <div className="px-3 pb-3 mt-1 text-sm text-gray-900">
                      {a?.answer?.trim() || "—"}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No answers provided.</p>
            )}
          </div>

          {/* Applicant Message */}
          <div className="mt-6">
            <div className="text-sm font-semibold text-gray-800 mb-1">
              Applicant Message
            </div>
            <div className="text-sm text-gray-900 border rounded-lg p-2 min-h-[44px] bg-white">
              {message?.trim() || "—"}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t flex items-center justify-end gap-2">
          <button
            onClick={handleReject}
            className="px-3 py-1.5 rounded-lg bg-red-500 text-gray-100 text-sm hover:bg-gray-200"
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            className="px-3 py-1.5 rounded-lg bg-green-500 text-white text-sm hover:bg-[#0F2FA0]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
