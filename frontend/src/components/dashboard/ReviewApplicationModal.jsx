import { useEffect, useMemo, useState } from "react";
import { X, ExternalLink } from "lucide-react";

/** If you already have a global API base, feel free to remove this */
const RAW_API_BASE = (import.meta.env?.VITE_API_BASE || "").trim();
const api = (p) => (RAW_API_BASE ? `${RAW_API_BASE}${p}` : p);

/**
 * Props
 * - open: boolean
 * - onClose: () => void
 * - applicationId: string (the Application _id)
 * - studentId: string (the student’s model _id)
 * - onDecision?: (status: "Accepted"|"Rejected") => void
 *
 * Optional props (if you already have them on the list page):
 * - defaultResumeUrl?: string
 */
export default function ReviewApplicationModal({
  open,
  onClose,
  applicationId,
  studentId,
  onDecision,
  defaultResumeUrl,
}) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState(null); // { fullName, course, school, skills[], bio, profilePicture, resumeUrl? }
  const [answers, setAnswers] = useState([]);   // [{question, answer}]
  const [message, setMessage] = useState("");   // string
  const [resumeUrl, setResumeUrl] = useState(defaultResumeUrl || "");

  // Fetch all details once opened
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const token = localStorage.getItem("ic_token") || "";
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    async function run() {
      try {
        setLoading(true);
        setError("");

        const [pRes, aRes, mRes] = await Promise.all([
          fetch(api(`/api/students/${studentId}/profile`), {
            credentials: "include",
            headers,
          }),
          fetch(api(`/api/applications/${applicationId}/screening-answers`), {
            credentials: "include",
            headers,
          }),
          fetch(api(`/api/applications/${applicationId}/message`), {
            credentials: "include",
            headers,
          }),
        ]);

        // PROFILE
        let pJson = null;
        try { pJson = pRes.ok ? await pRes.json() : null; } catch {}
        const normalizedProfile = normalizeProfile(pJson);
        // Prefer application resume if provided separately
        const ru =
          normalizedProfile.resumeUrl ||
          defaultResumeUrl ||
          "";

        // ANSWERS
        let aJson = [];
        try { aJson = aRes.ok ? await aRes.json() : []; } catch {}
        const normalizedAnswers = normalizeAnswers(aJson);

        // MESSAGE
        let mJson = "";
        try {
          const raw = mRes.ok ? await mRes.json() : null;
          mJson = typeof raw === "string" ? raw : raw?.text || "";
        } catch {}

        if (!cancelled) {
          setProfile(normalizedProfile);
          setAnswers(normalizedAnswers);
          setMessage(mJson);
          setResumeUrl(ru);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [open, applicationId, studentId, defaultResumeUrl]);

  const nameInitials = useMemo(() => {
    const n = profile?.fullName || "";
    const parts = n.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "U";
  }, [profile]);

  const handleDecision = async (status) => {
    if (!applicationId) return;
    const token = localStorage.getItem("ic_token") || "";
    try {
      setBusy(true);
      setError("");
      const res = await fetch(api(`/api/applications/${applicationId}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      onDecision?.(status);
      onClose?.();
    } catch (e) {
      setError(e.message || "Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div className="absolute left-1/2 top-1/2 w-[680px] max-w-[96vw] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl border">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div>
            <h3 className="text-[15px] font-semibold text-[#0B2E82]">
              Review Application
            </h3>
            <p className="text-xs text-gray-500">
              Details and screening answers for the student’s application.
            </p>
          </div>
          <button
            className="p-2 rounded-md hover:bg-gray-100"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-gray-600 text-sm">Loading…</div>
          ) : (
            <>
              {/* Header block: avatar + name + resume button */}
              <div className="flex items-start gap-3">
                {/* avatar */}
                {profile?.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt={profile.fullName || "Student"}
                    className="w-12 h-12 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-100 border flex items-center justify-center text-sm font-semibold text-gray-700">
                    {nameInitials}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">
                      {profile?.fullName || "Unknown Applicant"}
                    </p>
                    <a
                      href={resumeUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border ${
                        resumeUrl
                          ? "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                          : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      }`}
                      onClick={(e) => {
                        if (!resumeUrl) e.preventDefault();
                      }}
                    >
                      View Resume <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <p className="text-sm text-gray-600 mt-0.5">
                    {profile?.course || "—"}
                    {profile?.school ? (
                      <>
                        , <span className="text-gray-500">{profile.school}</span>
                      </>
                    ) : null}
                  </p>

                  {/* skills */}
                  {!!(profile?.skills?.length) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profile.skills.slice(0, 12).map((s, i) => (
                        <span
                          key={`${s}-${i}`}
                          className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-700"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              <section>
                <h4 className="text-[13px] font-semibold text-gray-800 mb-2">
                  Bio
                </h4>
                <div className="text-sm text-gray-700 leading-relaxed">
                  {profile?.bio || "—"}
                </div>
              </section>

              {/* Screening Questions */}
              <section>
                <h4 className="text-[13px] font-semibold text-gray-800 mb-2">
                  Screening Questions
                </h4>

                {answers.length ? (
                  <ul className="space-y-3">
                    {answers.map((qa, idx) => (
                      <li
                        key={idx}
                        className="border rounded-md p-3 bg-white"
                      >
                        <p className="text-[13px] font-medium text-gray-800 mb-1">
                          {qa.question || `Question ${idx + 1}`}
                        </p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {qa.answer || "—"}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No answers provided.</p>
                )}
              </section>

              {/* Applicant Message */}
              <section>
                <h4 className="text-[13px] font-semibold text-gray-800 mb-2">
                  Message
                </h4>
                <div className="border rounded-md p-3 text-sm text-gray-800 whitespace-pre-wrap">
                  {message || "—"}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
          <button
            disabled={busy}
            onClick={() => handleDecision("Rejected")}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Reject
          </button>
          <button
            disabled={busy}
            onClick={() => handleDecision("Accepted")}
            className="px-4 py-2 rounded-md bg-[#1337B6] hover:bg-[#0F2FA0] text-white disabled:opacity-60"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function normalizeProfile(raw) {
  if (!raw) return {};
  // Support different shapes: raw.profile, raw.data, or flat
  const p =
    raw?.profile ||
    raw?.data ||
    raw;

  const fullName =
    p?.fullName ||
    [p?.firstName, p?.lastName].filter(Boolean).join(" ") ||
    "";

  // course/school: your Student model keeps course, and education[0].school
  const school =
    p?.school ||
    p?.education?.[0]?.school ||
    "";

  return {
    fullName,
    course: p?.course || "",
    school,
    bio: p?.bio || "",
    skills: Array.isArray(p?.skills) ? p.skills : [],
    profilePicture: p?.profilePicture || "",
    resumeUrl: p?.resumeUrl || "",
  };
}

function normalizeAnswers(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((r, i) => ({
      question: r?.question || `Q${i + 1}`,
      answer: r?.answer || "",
    }));
  }
  if (raw?.items && Array.isArray(raw.items)) {
    return raw.items.map((r, i) => ({
      question: r?.question || `Q${i + 1}`,
      answer: r?.answer || "",
    }));
  }
  // object map { "0": "...", "1": "..." }
  return Object.entries(raw).map(([k, v]) => ({
    question: `Q${Number(k) + 1}`,
    answer: String(v ?? ""),
  }));
}
