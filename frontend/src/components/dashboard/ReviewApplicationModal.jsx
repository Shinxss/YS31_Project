import { useEffect, useMemo, useState } from "react";

/* Resolve API base exactly like your pages do */
const RAW_API_BASE =
  (import.meta.env?.VITE_API_BASE ||
    (typeof window !== "undefined" && /:5173|:5174/.test(window.location.origin)
      ? "http://localhost:5000"
      : "")).trim();
const api = (p) => (RAW_API_BASE ? `${RAW_API_BASE}${p}` : p);

/* Endpoints */
const API = {
  studentProfile: (studentId) => api(`/api/students/${studentId}/profile`),
  screeningAnswers: (appId) => api(`/api/applications/${appId}/screening-answers`),
  applicantMessage: (appId) => api(`/api/applications/${appId}/message`),
  updateStatus: (id) => api(`/api/applications/${id}`),
  resumeFile: (fname) => api(`/uploads/resumes/${encodeURIComponent(fname)}`),
};

const Avatar = ({ src, name }) => (
  <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 border">
    {src ? (
      <img src={src} alt={name || "avatar"} className="h-full w-full object-cover" />
    ) : (
      <div className="h-full w-full flex items-center justify-center text-sm font-semibold text-gray-600">
        {(name || "?")
          .split(" ")
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase() || "")
          .join("") || "?"}
      </div>
    )}
  </div>
);

export default function ReviewApplicationModal({
  open,
  onClose,
  application, // {_id, student:{_id, fullName, firstName, lastName}, job, resume?}
  onStatusChange, // optional callback(statusString, applicationId)
}) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const authHeader = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("ic_token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const studentName =
    application?.student?.fullName ||
    [application?.student?.firstName, application?.student?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Unknown Applicant";

  const resumeUrl = useMemo(() => {
    if (application?.resume) return API.resumeFile(application.resume);
    if (profile?.resumeUrl) return profile.resumeUrl;
    return null;
  }, [application?.resume, profile?.resumeUrl]);

  useEffect(() => {
    if (!open || !application?._id || !application?.student?._id) return;

    let ignore = false;
    const load = async () => {
      try {
        setError("");
        setLoading(true);

        const [pr, ar, mr] = await Promise.all([
          fetch(API.studentProfile(application.student._id), {
            credentials: "include",
            headers: { ...authHeader() },
          }),
          fetch(API.screeningAnswers(application._id), {
            credentials: "include",
            headers: { ...authHeader() },
          }),
          fetch(API.applicantMessage(application._id), {
            credentials: "include",
            headers: { ...authHeader() },
          }),
        ]);

        const p = pr.ok ? await pr.json() : null;
        const a = ar.ok ? await ar.json() : [];
        const m = mr.ok ? await mr.json() : null;

        if (!ignore) {
          setProfile(p);
          setAnswers(Array.isArray(a) ? a : a?.items || []);
          setMessage(typeof m === "string" ? m : m?.text || "");
        }
      } catch (e) {
        if (!ignore) setError(e.message || "Failed to load applicant details.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, application?._id, application?.student?._id]);

  const patchStatus = async (status) => {
    if (!application?._id) return;
    try {
      setError("");
      setLoading(true);
      const res = await fetch(API.updateStatus(application._id), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "Failed to update status");
      }
      onStatusChange?.(status, application._id);
      onClose?.();
    } catch (e) {
      setError(e.message || "Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* centered card */}
      <div className="absolute inset-0 flex items-start sm:items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border">
          {/* Header */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Review Application: <span className="font-bold">{studentName}</span>
                </h2>
                <p className="text-xs text-gray-500">
                  Details and screening answers for the student’s application.
                </p>
              </div>

              {resumeUrl ? (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50 text-sm font-medium"
                >
                  View Resume
                </a>
              ) : (
                <span className="text-xs text-gray-400">No resume</span>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
                {error}
              </div>
            )}

            {/* Top summary row */}
            <div className="flex items-start gap-3">
              <Avatar
                src={profile?.profilePicture}
                name={studentName}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-gray-900">
                  {studentName}
                </div>
                <div className="text-xs text-gray-600">
                  {profile?.course ? profile.course : "-"}
                  {profile?.school ? `, ${profile.school}` : ""}
                </div>

                {/* skills chips */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {(profile?.skills || []).slice(0, 10).map((s, i) => (
                    <span
                      key={`${s}-${i}`}
                      className="px-2 py-1 text-[11px] rounded-full border bg-gray-50 text-gray-700"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Bio</h4>
              <p className="text-sm leading-6 text-gray-700 whitespace-pre-wrap">
                {profile?.bio || "—"}
              </p>
            </div>

            {/* Screening Questions */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Screening Questions
              </h4>
              {answers?.length ? (
                <ul className="space-y-3">
                  {answers.map((a, idx) => (
                    <li key={idx} className="border rounded-lg p-3">
                      <p className="text-sm font-medium mb-1">
                        {a?.question ? a.question : `Question ${idx + 1}`}
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {a?.answer || "—"}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600">No answers provided.</p>
              )}
            </div>

            {/* Applicant message */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Applicant Message
              </h4>
              <div className="border rounded-lg p-3 text-sm text-gray-800 whitespace-pre-wrap">
                {message || "—"}
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="px-6 py-4 border-t flex items-center justify-end gap-2">
            <button
              disabled={loading}
              onClick={() => patchStatus("Rejected")}
              className="px-3 py-2 rounded-md border text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Reject
            </button>
            <button
              disabled={loading}
              onClick={() => patchStatus("Accepted")}
              className="px-4 py-2 rounded-md bg-[#1337B6] text-white text-sm font-medium hover:bg-[#0F2FA0] disabled:opacity-60"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
