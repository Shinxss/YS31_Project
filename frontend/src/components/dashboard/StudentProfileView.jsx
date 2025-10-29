// src/components/dashboard/StudentProfileView.jsx
import React, { useEffect, useMemo, useState } from "react";

/* API base (env first, Vite dev fallback) */
const RAW_API_BASE =
  (import.meta.env?.VITE_API_BASE ||
    (typeof window !== "undefined" && /:5173|:5174/.test(window.location.origin)
      ? "http://localhost:5000"
      : "")).trim();
const api = (p) => (RAW_API_BASE ? `${RAW_API_BASE}${p}` : p);

const Dash = ({ v }) => <>{v ?? v === 0 ? v : "—"}</>;

const Card = ({ children, className = "" }) => (
  <div className={`bg-white shadow-lg rounded-xl ${className}`}>{children}</div>
);

export default function StudentProfileView({ studentId, onBack }) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("ic_company_token") ||
        localStorage.getItem("ic_token")
      : null;

  const authHeader = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [s, setS] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const r = await fetch(api(`/api/students/${studentId}/profile`), {
          headers: { ...authHeader },
          credentials: "include",
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data?.message || "Failed to load profile");
        if (!ignore) setS(data);
      } catch (e) {
        if (!ignore) setErr(e.message || "Failed to load profile");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => (ignore = true);
  }, [studentId]);

  const fullName =
    s?.fullName || [s?.firstName, s?.lastName].filter(Boolean).join(" ");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Back button */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
        >
          ← Back to Applications
        </button>
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
          {err}
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* LEFT CARD (matches student design) */}
        <Card className="p-8 flex flex-col items-center text-center w-full min-w-[360px]">
          {/* Avatar */}
          <div className="relative w-32 h-32 mb-4">
            {s?.profilePicture ? (
              <img
                src={s.profilePicture}
                alt={fullName || "Student"}
                className="w-full h-full object-cover rounded-full border-4 border-blue-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center rounded-full bg-blue-200 text-blue-800 text-3xl font-semibold border-4 border-blue-500">
                {(fullName || " ? ").trim().slice(0, 2).replace(" ", "")}
              </div>
            )}
          </div>

          {/* Name + course */}
          <h3 className="text-lg font-bold text-[#173B8A] mb-1">
            <Dash v={fullName} />
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            <Dash v={s?.course || "Student"} />
          </p>

          {/* About */}
          <div className="w-full mt-4 text-left">
            <h4 className="text-sm font-semibold text-gray-700">About:</h4>
            <p className="text-gray-700 text-sm mt-1 whitespace-pre-line">
              {s?.bio?.trim() || "—"}
            </p>
          </div>

          {/* Skills */}
          <div className="w-full mt-4 text-left">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Skills:</h4>
            {s?.skills?.length ? (
              <div className="flex flex-wrap gap-2">
                {s.skills.map((k, i) => (
                  <span
                    key={`${k}-${i}`}
                    className="bg-gray-100 border border-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full"
                  >
                    {k}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 text-sm">—</span>
            )}
          </div>
        </Card>

        {/* RIGHT STACK (Basic info + sections) */}
        <div className="md:col-span-2 space-y-6">
          {/* BASIC INFO */}
          <Card className="p-6">
            <h4 className="text-lg font-bold text-blue-900 mb-4">
              Basic Information
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500 text-xs">Email</div>
                <div className="text-gray-900">
                  <Dash v={s?.email} />
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Age</div>
                <div className="text-gray-900">
                  <Dash v={s?.age} />
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Location</div>
                <div className="text-gray-900">
                  <Dash v={s?.location} />
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Contact Number</div>
                <div className="text-gray-900">
                  <Dash v={s?.contactNumber} />
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Gender</div>
                <div className="text-gray-900">
                  <Dash v={s?.gender} />
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Nationality</div>
                <div className="text-gray-900">
                  <Dash v={s?.race} />
                </div>
              </div>
            </div>
          </Card>

          {/* EXPERIENCE */}
          <Card className="p-6">
            <h4 className="text-lg font-bold text-blue-900 mb-4">Experience</h4>
            {s?.experience?.length ? (
              <ul className="space-y-4">
                {s.experience.map((e, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between bg-blue-50 rounded-lg p-4 border border-blue-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-3 rounded-md border border-gray-300">
                        {/* icon placeholder */}
                        <span role="img" aria-label="briefcase">💼</span>
                      </div>
                      <div className="leading-tight">
                        <p className="font-medium text-gray-900">{e.jobTitle}</p>
                        <p className="text-sm text-gray-700">{e.companyName}</p>
                        <p className="text-sm text-gray-600">
                          {e.startDate} {e.endDate ? `- ${e.endDate}` : "- Present"}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 text-sm">No experience listed.</p>
            )}
          </Card>

          {/* EDUCATION */}
          <Card className="p-6">
            <h4 className="text-lg font-bold text-blue-900 mb-4">Education</h4>
            {s?.education?.length ? (
              <ul className="space-y-4">
                {s.education.map((ed, i) => (
                  <li
                    key={i}
                    className="bg-blue-50 rounded-lg p-4 border border-blue-100"
                  >
                    <p className="font-medium text-gray-900">{ed.degree}</p>
                    <p className="text-sm text-gray-700">{ed.school}</p>
                    <p className="text-sm text-gray-600">
                      {ed.startDate} {ed.endDate ? `- ${ed.endDate}` : "- Present"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 text-sm">No education listed.</p>
            )}
          </Card>

          {/* CERTIFICATION */}
          <Card className="p-6">
            <h4 className="text-lg font-bold text-blue-900 mb-4">Certification</h4>
            {s?.certification?.length ? (
              <ul className="space-y-4">
                {s.certification.map((c, i) => (
                  <li
                    key={i}
                    className="bg-blue-50 rounded-lg p-4 border border-blue-100"
                  >
                    <p className="font-medium text-gray-900">{c.title}</p>
                    <p className="text-sm text-gray-700">{c.companyName}</p>
                    <p className="text-sm text-gray-600">{c.dateReceived}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 text-sm">No certifications listed.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
