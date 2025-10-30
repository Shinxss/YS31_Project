// src/pages/company/CompanyStudentProfile.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Briefcase,
  GraduationCap,
  Award,
  MapPin,
  Mail,
  Phone,
  Calendar,
  User,
} from "lucide-react";

const RAW_API_BASE =
  (import.meta.env?.VITE_API_BASE ||
    (typeof window !== "undefined" && /:5173|:5174/.test(window.location.origin)
      ? "http://localhost:5000"
      : "")).trim();
const api = (p) => (RAW_API_BASE ? `${RAW_API_BASE}${p}` : p);

export default function CompanyStudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("ic_company_token") ||
        localStorage.getItem("ic_token")
      : null;

  const authHeader = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const r = await fetch(api(`/api/students/${id}/profile`), {
          headers: { ...authHeader },
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data?.message || "Failed to load profile");
        if (!ignore) setStudent(data);
      } catch (e) {
        if (!ignore) setErr(e.message || "Failed to load profile");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => (ignore = true);
  }, [id]);

  if (loading)
    return (
      <div className="p-10 text-center text-gray-600">
        Loading student profile...
      </div>
    );

  if (err)
    return (
      <div className="p-10 text-center text-red-500">
        Error: {err}
        <br />
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-100 border rounded-md"
        >
          ← Go Back
        </button>
      </div>
    );

  const s = student || {};
  const fullName =
    s.fullName || [s.firstName, s.lastName].filter(Boolean).join(" ");

  return (
    <div className="min-h-screen w-full bg-white rounded-2xl">
      {/* HEADER */}
      <div className="flex items-center justify-between px-8 pt-6">
        {/* Left: Avatar + Name */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="h-20 w-20 md:h-24 md:w-24 rounded-full border border-gray-300 overflow-hidden bg-gray-100">
              {s.profilePicture ? (
                <img
                  src={s.profilePicture}
                  alt="avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-2xl md:text-3xl text-gray-600 font-semibold">
                  {(s.firstName?.[0] || "").toUpperCase()}
                  {(s.lastName?.[0] || "").toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="text-[22px] md:text-[26px] font-semibold leading-tight text-gray-900">
              {fullName || "Unnamed Student"}
            </div>
            <div className="text-sm md:text-base text-gray-500">
              {s.course || "Information Technology"}
            </div>
          </div>
        </div>

        
      </div>

      {/* MAIN GRID */}
      <div className="px-6 md:px-8 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* About Me */}
            <Card>
              <SectionTitle>About Me</SectionTitle>
              <p className="mt-2 text-sm text-gray-700 leading-6 whitespace-pre-line">
                {s.bio?.trim() ||
                  "No description provided."}
              </p>
            </Card>

            {/* Skills */}
            <Card>
              <SectionTitle>Skills</SectionTitle>
              <div className="mt-3 flex flex-wrap gap-2">
                {s.skills?.length ? (
                  s.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-gray-700 bg-white"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">No skills added</span>
                )}
              </div>
            </Card>

            {/* Contact & Details */}
            <Card>
              <SectionTitle>Contact & Details</SectionTitle>
              <div className="mt-3 space-y-4">
                <KV label="Email" value={s.email || "—"} />
                <KV label="Contact Number" value={s.contactNumber || "—"} />
                <KV label="Location" value={s.location || "—"} />
                <div className="grid grid-cols-3 gap-4">
                  <KV label="Age" value={s.age || "—"} />
                  <KV label="Gender" value={s.gender || "—"} />
                  <KV label="Nationality" value={s.race || "—"} />
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 space-y-8">
            <SectionBlock title="Work Experience">
              <List type="experience" items={s.experience} icon={Briefcase} />
            </SectionBlock>

            <SectionBlock title="Education">
              <List type="education" items={s.education} icon={GraduationCap} />
            </SectionBlock>

            <SectionBlock title="Certifications">
              <List type="certification" items={s.certification} icon={Award} />
            </SectionBlock>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------- UI SUBCOMPONENTS ---------------------- */
function Card({ children }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 className="text-base font-semibold text-gray-800">{children}</h3>;
}

function SectionBlock({ title, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function List({ type, items = [], icon: Icon }) {
  if (!items.length) {
    return <p className="text-sm text-gray-600">No {type} added yet.</p>;
  }

  return items.map((item, i) => {
    const title =
      type === "experience"
        ? item.jobTitle
        : type === "education"
        ? item.degree
        : item.title;

    const org =
      type === "experience"
        ? item.companyName
        : type === "education"
        ? item.school
        : item.companyName;

    const sub =
      type === "certification"
        ? item.companyName
        : `${formatYear(item.startDate)} - ${
            item.endDate ? formatYear(item.endDate) : "Present"
          }`;

    const rightSub =
      type === "certification" && item.dateReceived
        ? formatMonthYear(item.dateReceived)
        : null;

    return (
      <div
        key={i}
        className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Icon className="h-6 w-6 text-blue-700" />
          </div>
          <div className="leading-tight">
            <div className="font-medium text-gray-900">{title || "—"}</div>
            <div className="text-sm text-gray-700">{org || "—"}</div>
            <div className="text-sm text-gray-500">
              {rightSub ? rightSub : sub}
            </div>
          </div>
        </div>
      </div>
    );
  });
}

function KV({ label, value }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-600">{label}</div>
      <div className="mt-1 text-sm text-gray-900">{value || "—"}</div>
    </div>
  );
}

/* Date helpers */
function formatYear(d) {
  try {
    return new Date(d).getFullYear();
  } catch {
    return "—";
  }
}
function formatMonthYear(d) {
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}
