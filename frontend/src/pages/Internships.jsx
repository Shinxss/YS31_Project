import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link, useLocation } from "react-router-dom";
import {
  MapPin,
  Clock3,
  Tag,
  Search as SearchIcon,
  ChevronDown,
} from "lucide-react";

/* ---------- API base (relative by default) ---------- */
const RAW_API_BASE = (import.meta.env?.VITE_API_BASE || "").trim();
const api = (path) => (RAW_API_BASE ? `${RAW_API_BASE}${path}` : path);
const JOBS_URL = api("/api/jobs");

export default function Internships() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters
  const [q, setQ] = useState("");
  const [field, setField] = useState("All Fields");
  const [jtype, setJtype] = useState("All Types");
  const [loc, setLoc] = useState("All Locations");

  const locationHook = useLocation();

  // ⬇️ read ?q=&location= and pre-fill filters
  useEffect(() => {
    const sp = new URLSearchParams(locationHook.search);
    const qParam = sp.get("q") || "";
    const locParam = sp.get("location") || "";
    if (qParam) setQ(qParam);
    if (locParam) setLoc(locParam);
  }, [locationHook.search]);

  const fetchJobs = async (signal) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(JOBS_URL, { signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load jobs");
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    fetchJobs(ac.signal);
    return () => ac.abort();
  }, []);

  // derive filter options from data
  const fields = useMemo(() => {
    const s = new Set();
    jobs.forEach((j) => j.department && s.add(j.department));
    return ["All Fields", ...Array.from(s)];
  }, [jobs]);

  const types = useMemo(() => {
    const s = new Set();
    jobs.forEach((j) => (j.jobType || j.workType) && s.add(j.jobType || j.workType));
    return ["All Types", ...Array.from(s)];
  }, [jobs]);

  const locations = useMemo(() => {
    const s = new Set();
    jobs.forEach((j) => j.location && s.add(j.location));
    // If the URL gave a custom 'loc' that isn't in the set, include it once
    if (loc !== "All Locations" && loc && !s.has(loc)) s.add(loc);
    return ["All Locations", ...Array.from(s)];
  }, [jobs, loc]);

  // filtered list
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchQ =
        !qq ||
        [j.title, j.companyName, j.department, j.location, ...(j.skills || [])]
          .filter(Boolean)
          .some((t) => String(t).toLowerCase().includes(qq));

      const matchField = field === "All Fields" || j.department === field;
      const JT = j.jobType || j.workType || "";
      const matchType = jtype === "All Types" || JT === jtype;
      const matchLoc = loc === "All Locations" || j.location === loc;

      return matchQ && matchField && matchType && matchLoc;
    });
  }, [jobs, q, field, jtype, loc]);

  return (
    <div className="bg-[#F6F8FC] min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-8">
          {/* Title */}
          <h1 className="text-3xl md:text-[32px] font-bold text-gray-900">
            Find Your Perfect{" "}
            <span className="bg-gradient-to-r from-blue-900 via-blue-700 to-[#F37526] bg-clip-text text-transparent">
              Internship
            </span>
          </h1>
          <p className="text-gray-600 mt-2">
            Discover {filtered.length} {filtered.length === 1 ? "opportunity" : "opportunities"} from top companies
          </p>

          {/* Search + filters */}
          <div className="mt-5">
            <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex-1 relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search jobs, companies, or skills..."
                    className="w-full h-11 pl-9 pr-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <FilterPill label={field} options={fields} onSelect={setField} />
                <FilterPill label={jtype} options={types} onSelect={setJtype} />
                <FilterPill label={loc} options={locations} onSelect={setLoc} />
              </div>
            </div>
          </div>

          {/* Results summary */}
          <div className="mt-6 text-sm text-gray-500">
            {loading
              ? "Loading opportunities…"
              : error
              ? (
                <span className="text-red-600 inline-flex items-center gap-3">
                  {error}
                  <button
                    onClick={() => fetchJobs()}
                    className="text-blue-700 hover:underline"
                  >
                    Retry
                  </button>
                </span>
              )
              : <>{filtered.length} opportunities found</>}
          </div>

          {/* Results list */}
          <div className="mt-3 space-y-4">
            {filtered.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
            {!loading && !error && filtered.length === 0 && (
              <div className="text-center text-gray-500 py-12">No results.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------------- Components ---------------- */

function JobCard({ job }) {
  const company = job.companyName || "Company";
  const title = job.title || "Internship";
  const description = job.description || "";
  const location = job.location || "—";
  const JT = job.jobType || job.workType || "";
  const dept = job.department || "—";
  const skills = Array.isArray(job.skills) ? job.skills.slice(0, 6) : [];
  const posted = timeAgo(job.createdAt);
  const months = job.durationMonths ?? job.months ?? null;

  const salary =
    Number.isFinite(job.salaryMaxNumber)
      ? `₱${Number(job.salaryMaxNumber).toLocaleString()}/month`
      : (job.salaryMax ? `${job.salaryMax}/month` : null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5">
      <div className="flex items-start gap-3 md:gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-900 text-white font-semibold shrink-0">
          {company.charAt(0)}
        </div>

        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center md:gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link to={`/jobs/${job._id}`} className="font-semibold text-gray-900 hover:underline">
                  {title}
                </Link>
                {posted && (
                  <span className="text-[11px] px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                    {posted}
                  </span>
                )}
              </div>
              <div className="text-[13px] text-gray-500 mt-0.5">
                <span className="font-medium text-gray-700">{company}</span>
              </div>
            </div>

            <div className="mt-3 md:mt-0 flex items-center gap-3 shrink-0">
              {salary && (
                <div className="text-right">
                  <div className="text-[#1A33A2] font-bold leading-tight">
                    {salary}
                  </div>
                </div>
              )}
              <Link
                to={`/jobs/${job._id}`}
                className="inline-flex items-center justify-center bg-[#F37526] hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-md"
              >
                View Details
              </Link>
            </div>
          </div>

          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{description}</p>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[13px] text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="truncate">{location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-gray-400" />
              <span className="truncate">
                {months ? `${months} months · ` : ""}{JT || "—"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-gray-400" />
              <span className="truncate">{dept}</span>
            </div>
          </div>

          {skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.map((s, i) => (
                <span key={i} className="text-[11px] px-2 py-1 rounded-full border border-gray-300 text-gray-700">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Simple dropdown pill */
function FilterPill({ label, options, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-11 inline-flex items-center gap-2 px-3 rounded-md border border-gray-200 text-sm bg-white hover:bg-gray-50"
      >
        {label}
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>
      {open && (
        <div
          className="absolute z-20 mt-1 w-48 max-h-64 overflow-auto bg-white border border-gray-200 rounded-md shadow-md"
          onMouseLeave={() => setOpen(false)}
        >
          {options.map((opt) => (
            <button
              key={opt}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                opt === label ? "text-[#1A33A2] font-medium" : "text-gray-700"
              }`}
              onClick={() => {
                onSelect(opt);
                setOpen(false);
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* helpers */
function timeAgo(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d >= 30) return "1 month ago";
  if (d >= 7) return `${Math.floor(d / 7)} week${Math.floor(d/7) > 1 ? "s" : ""} ago`;
  if (d >= 1) return `${d} day${d > 1 ? "s" : ""} ago`;
  if (h >= 1) return `${h} hour${h > 1 ? "s" : ""} ago`;
  if (m >= 1) return `${m} minute${m > 1 ? "s" : ""} ago`;
  return "just now";
}
