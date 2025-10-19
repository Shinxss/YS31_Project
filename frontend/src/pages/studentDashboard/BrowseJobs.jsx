// src/pages/studentDashboard/BrowseJobs.jsx
import React, { useState, useEffect, useMemo } from "react";
import { MapPin, Clock, Briefcase, Search, Star, Building2 } from "lucide-react";
import { getAllJobs } from "@/services/api";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom"; // ✅ added

/* ✅ toggle true to show company logos */
const SHOW_COMPANY_LOGOS = true;
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function BrowseJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [field, setField] = useState("All Fields");
  const [type, setType] = useState("All Types");
  const [location, setLocation] = useState("All Locations");
  const [badLogos, setBadLogos] = useState({});

  const navigate = useNavigate(); // ✅ added
  const loc = useLocation(); // ✅ added

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await getAllJobs();
        const list = Array.isArray(data) ? data : data.jobs || [];
        setJobs(list);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load job listings");
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // ✅ valid absolute/relative image checker
  const isValidImageUrl = (url) => {
    if (!url) return false;
    const s = String(url).trim();
    return /^(https?:\/\/|\/|blob:|data:image)/i.test(s);
  };

  // ✅ normalize filenames or partial paths to a usable URL
  const buildImageUrl = (raw) => {
    if (!raw) return null;
    const v = String(raw).trim();

    // already a full/relative URL we can use
    if (isValidImageUrl(v)) return v;

    // strip leading slashes for consistency
    const filename = v.replace(/^\/+/, "");

    // If it already includes 'uploads', make sure it's absolute
    if (/^uploads\//i.test(filename)) {
      return `${API_BASE}/${filename}`;
    }

    // Try common upload paths (your files are in /uploads/company)
    const candidates = [
      `${API_BASE}/uploads/company/${filename}`, // 👈 added (matches your folder)
      `${API_BASE}/uploads/${filename}`,
      `/uploads/${filename}`, // same-origin static (if proxied)
    ];

    return candidates[0]; // primary choice
  };

  // case-insensitive helpers
  const toTitle = (s) =>
    s ? String(s).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : s;

  const uniqueCI = (arr) => {
    const seen = new Set();
    const out = [];
    for (const raw of arr) {
      if (!raw) continue;
      const v = String(raw).trim();
      if (!v) continue;
      const key = v.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(toTitle(v));
      }
    }
    return out;
  };

  const notInListCI = (value, list) =>
    !list.some((x) => String(x).toLowerCase() === String(value).toLowerCase());

  /* ===== Dynamic Filter Options ===== */
  const dynamicFields = useMemo(() => {
    const set = new Set();
    for (const j of jobs) if (j?.department) set.add(j.department);
    return uniqueCI(Array.from(set));
  }, [jobs]);

  const dynamicTypes = useMemo(() => {
    const set = new Set();
    for (const j of jobs) {
      if (j?.jobType) set.add(j.jobType);
      if (j?.workType) set.add(j.workType);
    }
    return uniqueCI(Array.from(set));
  }, [jobs]);

  const dynamicLocations = useMemo(() => {
    const set = new Set();
    for (const j of jobs) if (j?.location) set.add(j.location);
    return uniqueCI(Array.from(set));
  }, [jobs]);

  const staticFields = ["Technology", "Design", "Business", "Education"];
  const staticTypes = ["Full-time", "Part-time", "Remote"];
  const staticLocations = [];

  const fieldsForSelect = useMemo(
    () => [
      ...staticFields,
      ...dynamicFields.filter((opt) => notInListCI(opt, staticFields)),
    ],
    [dynamicFields]
  );
  const typesForSelect = useMemo(
    () => [
      ...staticTypes,
      ...dynamicTypes.filter((opt) => notInListCI(opt, staticTypes)),
    ],
    [dynamicTypes]
  );
  const locationsForSelect = useMemo(
    () => [
      ...staticLocations,
      ...dynamicLocations.filter((opt) => notInListCI(opt, staticLocations)),
    ],
    [dynamicLocations]
  );

  // ===== Filtering logic =====
  const filteredJobs = jobs.filter((job) => {
    const company = job.companySnapshot || job.companyId || {};
    const matchesQuery =
      job.title?.toLowerCase().includes(query.toLowerCase()) ||
      job.companyName?.toLowerCase().includes(query.toLowerCase()) ||
      company.companyName?.toLowerCase().includes(query.toLowerCase()) ||
      job.skills?.some((s) => s.toLowerCase().includes(query.toLowerCase()));

    const matchesField =
      field === "All Fields" ||
      job.department?.toLowerCase() === field.toLowerCase();

    const matchesType =
      type === "All Types" ||
      job.jobType?.toLowerCase() === type.toLowerCase() ||
      job.workType?.toLowerCase() === type.toLowerCase();

    const matchesLocation =
      location === "All Locations" ||
      job.location?.toLowerCase().includes(location.toLowerCase()) ||
      company.city?.toLowerCase().includes(location.toLowerCase());

    return matchesQuery && matchesField && matchesType && matchesLocation;
  });

  // helper: time ago
  const timeAgo = (iso) => {
    if (!iso) return "—";
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, now - then);
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (mins < 60) return `${mins || 1} min${mins === 1 ? "" : "s"} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    return `${days} day${days === 1 ? "" : "s"} ago`;
  };

  return (
    <div className="p-6 bg-[#ECF3FC] min-h-screen overflow-y-auto">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-900">
          Find Your Perfect <span className="text-[#F37526]">Internship</span>
        </h1>
        <p className="text-gray-600 mt-1">
          Discover {filteredJobs.length} opportunities from top companies
        </p>
      </div>

      {/* SEARCH + FILTER BAR */}
      <div className="bg-white rounded-lg shadow p-4 mb-8 flex flex-wrap items-center gap-3">
        <div className="flex items-center bg-[#ECF3FC] rounded-md px-3 py-2 flex-1 min-w-[250px]">
          <Search className="w-4 h-4 text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search jobs, companies, or skills..."
            className="bg-transparent outline-none w-full text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <select
          className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700"
          value={field}
          onChange={(e) => setField(e.target.value)}
        >
          <option>All Fields</option>
          {fieldsForSelect.map((opt) => (
            <option key={`field-${opt}`}>{opt}</option>
          ))}
        </select>

        <select
          className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option>All Types</option>
          {typesForSelect.map((opt) => (
            <option key={`type-${opt}`}>{opt}</option>
          ))}
        </select>

        <select
          className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          <option>All Locations</option>
          {locationsForSelect.map((opt) => (
            <option key={`loc-${opt}`}>{opt}</option>
          ))}
        </select>
      </div>

      {/* JOB CARDS */}
      {loading ? (
        <div className="text-center text-gray-600 mt-10">
          Loading job listings...
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          No job postings yet.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const company = job.companySnapshot || job.companyId || {};

            // Build a resilient logo URL from snapshot or populated data
            const rawLogo =
              company.profileImage ||
              company.coverPhoto ||
              company.logo ||
              company.avatarUrl ||
              null;

            const logo = buildImageUrl(rawLogo);
            const companyDisplayName =
              company.companyName ||
              job.companySnapshot?.companyName ||
              job.companyName ||
              "Unknown Company";

            const logoKey = company._id || job._id || companyDisplayName;

            return (
              <div
                key={job._id}
                className="border border-blue-200 rounded-lg bg-white p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    {/* LOGO */}
                    {SHOW_COMPANY_LOGOS &&
                    logo &&
                    isValidImageUrl(logo) &&
                    !badLogos[logoKey] ? (
                      <img
                        src={logo}
                        alt={companyDisplayName}
                        className="w-10 h-10 rounded-md object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setBadLogos((prev) => ({ ...prev, [logoKey]: true }))
                        }
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-blue-900 text-white flex items-center justify-center font-bold text-lg">
                        {(companyDisplayName && companyDisplayName[0]) || "C"}
                      </div>
                    )}

                    {/* JOB INFO */}
                    <div>
                      <h3 className="font-semibold text-blue-900 text-[16px]">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <span>{companyDisplayName}</span>
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 ml-1" />
                        <span>{company.rating ?? "4.8"}</span>
                      </div>

                      <p className="text-gray-600 text-sm mt-1 max-w-xl">
                        {job.description?.slice(0, 120) ||
                          "Join our engineering team to build cutting-edge applications."}
                      </p>

                      <div className="flex flex-wrap gap-5 mt-2 text-gray-600 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location || company.city || "Pangasinan"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{job.jobType || "Full-time"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          <span>{job.workType || "On-site"}</span>
                        </div>
                        {job.department && (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            <span>{toTitle(job.department)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {(job.skills || []).map((skill, i) => (
                          <span
                            key={`${skill}-${i}`}
                            className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full border border-gray-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT SIDE */}
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-blue-800 text-sm bg-blue-100 px-2 py-0.5 rounded-full">
                      {timeAgo(job.createdAt)}
                    </span>
                    <p className="text-blue-900 font-semibold text-lg">
                      {job.salaryMax || "₱4000"}/month
                    </p>

                    {/* ✅ navigate to job details */}
                    <button
                      onClick={() => navigate(`/student/jobs/${job._id}`, { state: { from: loc.pathname } })}
                      className="bg-[#F37526] hover:bg-[#e36210] text-white text-sm px-4 py-1.5 rounded-md font-medium"
                    >
                      View Details
                    </button>
                    {/* ✅ end added */}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}