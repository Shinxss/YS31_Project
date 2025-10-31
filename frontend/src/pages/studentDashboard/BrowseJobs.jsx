// src/pages/studentDashboard/BrowseJobs.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Clock,
  Briefcase,
  Search,
  Star,
  Building2,
  Filter,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { getAllJobs } from "@/services/api";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";

/* ✅ toggle true to show company logos */
const SHOW_COMPANY_LOGOS = true;
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

/* Page size */
const ITEMS_PER_PAGE = 10;

export default function BrowseJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState("");
  const [field, setField] = useState("All Fields");
  const [type, setType] = useState("All Types");
  const [location, setLocation] = useState("All Locations");

  // Sort (content-based relevance by default)
  const [sortBy, setSortBy] = useState("relevance"); // relevance | newest | oldest | salary_desc | salary_asc | company_az

  // Pagination
  const [page, setPage] = useState(1);

  // Logos
  const [companyLogos, setCompanyLogos] = useState({});
  const [badLogos, setBadLogos] = useState({});

  const navigate = useNavigate();
  const loc = useLocation();

  const token = useMemo(() => localStorage.getItem("ic_token") || "", []);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  /* ------------------ image URL helpers ------------------ */
  const isValidImageUrl = (url) => {
    if (!url) return false;
    const s = String(url).trim();
    return /^(https?:\/\/|\/|blob:|data:image)/i.test(s);
  };

  const buildImageUrl = (raw) => {
    if (!raw) return "";
    let v = String(raw).trim();
    if (isValidImageUrl(v)) return v;
    v = v.replace(/^\/+/, "");
    v = v.replace(/^uploads\//i, "");
    v = v.replace(/^company\//i, "");
    return `${API_BASE}/uploads/company/${encodeURIComponent(v)}`;
  };

  /* --------------- fetch missing company logos --------------- */
  const companiesNeedingLogos = useMemo(() => {
    const need = new Set();
    for (const job of jobs) {
      const comp = job.companySnapshot || job.companyId || {};
      const compId = comp._id || job.companyId?._id || job.companyId || null;
      const hasInlineLogo =
        comp.profileImageUrl ||
        comp.profileImage ||
        comp.profilePhoto ||
        comp.coverPhoto ||
        comp.logo ||
        comp.avatarUrl;
      if (compId && !hasInlineLogo && !companyLogos[compId]) {
        need.add(String(compId));
      }
    }
    return Array.from(need);
  }, [jobs, companyLogos]);

  useEffect(() => {
    if (companiesNeedingLogos.length === 0) return;
    let ignore = false;
    (async () => {
      const fetched = {};
      for (const id of companiesNeedingLogos) {
        try {
          const base = API_BASE.replace(/\/+$/, "");
          const tryFetch = async (url, withAuth) => {
            const res = await fetch(url, {
              headers: {
                "Content-Type": "application/json",
                ...(withAuth && token ? { Authorization: `Bearer ${token}` } : {}),
              },
              credentials: "include",
            });
            if (!res.ok) throw new Error(String(res.status));
            return res.json();
          };
          let data = null;
          try {
            data = await tryFetch(`${base}/api/company/${id}`, true);
          } catch {
            try {
              data = await tryFetch(`${base}/api/company/public/${id}`, false);
            } catch {
              data = null;
            }
          }
          const doc = data?.company ? data.company : data;
          const raw = doc?.profileImageUrl || doc?.profileImage || doc?.profilePhoto || "";
          const url = buildImageUrl(raw);
          fetched[id] = { url: url || "", ok: !!url };
        } catch {
          fetched[id] = { url: "", ok: false };
        }
      }
      if (!ignore && Object.keys(fetched).length) {
        setCompanyLogos((prev) => ({ ...prev, ...fetched }));
      }
    })();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companiesNeedingLogos, token]);

  /* ---------------- case-insensitive helpers ---------------- */
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

  /* ---------------- dynamic filter options ---------------- */
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

  /* --------------------- filtering --------------------- */
  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((job) => {
      const company = job.companySnapshot || job.companyId || {};
      const matchesQuery =
        !q ||
        job.title?.toLowerCase().includes(q) ||
        job.companyName?.toLowerCase().includes(q) ||
        (company.companyName || "").toLowerCase().includes(q) ||
        (job.skills || []).some((s) => String(s).toLowerCase().includes(q)) ||
        job.description?.toLowerCase().includes(q);

      const matchesField =
        field === "All Fields" ||
        job.department?.toLowerCase() === field.toLowerCase();

      const matchesType =
        type === "All Types" ||
        job.jobType?.toLowerCase() === type.toLowerCase() ||
        job.workType?.toLowerCase() === type.toLowerCase();

      const matchesLocation =
        location === "All Locations" ||
        (job.location || "").toLowerCase().includes(location.toLowerCase()) ||
        (company.city || "").toLowerCase().includes(location.toLowerCase());

      return matchesQuery && matchesField && matchesType && matchesLocation;
    });
  }, [jobs, query, field, type, location]);

  /* --------------- content + quality relevance --------------- */
  const tokenize = (s) =>
    (s || "")
      .toLowerCase()
      .replace(/[^a-z0-9+.#\- ]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

  const jaccard = (aArr, bArr) => {
    const A = new Set(aArr);
    const B = new Set(bArr);
    if (A.size === 0 || B.size === 0) return 0;
    let inter = 0;
    for (const x of A) if (B.has(x)) inter++;
    return inter / (A.size + B.size - inter);
  };

  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  const relevanceScore = (job, q) => {
    const qTokens = tokenize(q);
    const titleTok = tokenize(job.title);
    const skillTok = (job.skills || []).map((s) => String(s).toLowerCase());
    const descTok = tokenize(job.description);

    // Content overlap signals
    const titleOverlap = jaccard(qTokens, titleTok);
    const skillsOverlap = jaccard(qTokens, skillTok);
    const descOverlap = jaccard(qTokens, descTok);
    const contentScore = qTokens.length
      ? 0.6 * titleOverlap + 0.3 * skillsOverlap + 0.1 * descOverlap
      : 0.5;

    // Quality signals (independent of salary)
    const descRichness = clamp01(descTok.length / 120); // baseline 120 tokens
    const skillsRichness = clamp01((job.skills?.length || 0) / 6); // baseline 6 skills
    const qualityScore = 0.6 * descRichness + 0.4 * skillsRichness;

    // Freshness (light)
    const created =
      job.createdAt || job.created_at || job.postedAt || job.posted_at || job.updatedAt;
    const days = created
      ? Math.max(0, (Date.now() - new Date(created).getTime()) / 86400000)
      : 60;
    const fresh = clamp01(1 - days / 60);

    // Final relevance (content > quality > freshness)
    const score = 0.7 * contentScore + 0.2 * qualityScore + 0.1 * fresh;

    return { score: Number(score.toFixed(3)), reasons: [] };
  };

  /* ----- salary + name helpers (for proper Low→High & A→Z) ----- */
  const moneyParts = (raw) => {
    if (raw == null) return { min: NaN, max: NaN };
    const s = String(raw).toLowerCase().trim();
    const pieces = s.split(/-|–|to|~/i).map((x) => x.trim());
    const nums = pieces.map((piece) => {
      if (!piece) return NaN;
      const k = piece.match(/([\d.,]+)\s*k\+?\b/);
      if (k) return Number(k[1].replace(/[^\d.]/g, "")) * 1000;
      const n = piece.replace(/[^\d.]/g, "");
      return n ? Number(n) : NaN;
    });
    if (nums.length >= 2) {
      const min = Math.min(nums[0], nums[1]);
      const max = Math.max(nums[0], nums[1]);
      return { min, max };
    }
    const single = nums[0];
    return { min: single, max: single };
  };

  const getSalaryMin = (job) => {
    const a = moneyParts(
      job.salaryMin ?? job.salary_min ?? job.salary ?? job.compensation ?? job.pay
    );
    if (!isNaN(a.min)) return a.min;
    const b = moneyParts(job.salaryMax ?? job.salary_max);
    return b.min;
  };

  const getSalaryMax = (job) => {
    const a = moneyParts(
      job.salaryMax ?? job.salary_max ?? job.salary ?? job.compensation ?? job.pay
    );
    if (!isNaN(a.max)) return a.max;
    const b = moneyParts(job.salaryMin ?? job.salary_min);
    return b.max;
  };

  const companyNameOf = (j) =>
    (
      j?.companySnapshot?.companyName ??
      j?.companyId?.companyName ??
      j?.companyName ??
      ""
    )
      .toString()
      .trim();

  /* ---------------------- sorting ---------------------- */
  const visibleJobs = useMemo(() => {
    const withRel = filteredJobs.map((j) => {
      const { score, reasons } = relevanceScore(j, query);
      return { ...j, __rel: score, __why: reasons };
    });

    const createdTime = (j) => {
      const d = j.createdAt || j.created_at || j.postedAt || j.posted_at || j.updatedAt;
      const t = d ? new Date(d).getTime() : 0;
      return isNaN(t) ? 0 : t;
    };

    const cmpAZ = (a, b) =>
      companyNameOf(a).localeCompare(companyNameOf(b), undefined, {
        sensitivity: "base",
      });

    const toBottomIfNaN = (x) => (isNaN(x) ? Infinity : x);

    switch (sortBy) {
      case "newest":
        return withRel.slice().sort((a, b) => createdTime(b) - createdTime(a));

      case "oldest":
        return withRel.slice().sort((a, b) => createdTime(a) - createdTime(b));

      case "salary_desc":
        // Highest available max first; missing salaries go to bottom
        return withRel.slice().sort((a, b) => {
          const A = toBottomIfNaN(getSalaryMax(b));
          const B = toBottomIfNaN(getSalaryMax(a));
          return A - B || createdTime(b) - createdTime(a);
        });

      case "salary_asc":
        // Lowest available min first; missing salaries go to bottom
        return withRel.slice().sort((a, b) => {
          const A = toBottomIfNaN(getSalaryMin(a));
          const B = toBottomIfNaN(getSalaryMin(b));
          return A - B || createdTime(b) - createdTime(a);
        });

      case "company_az":
        return withRel
          .slice()
          .sort((a, b) => cmpAZ(a, b) || createdTime(b) - createdTime(a));

      case "relevance":
      default:
        // content + quality first, newest as tiebreaker
        return withRel
          .slice()
          .sort((a, b) => (b.__rel || 0) - (a.__rel || 0) || createdTime(b) - createdTime(a));
    }
  }, [filteredJobs, sortBy, query]);

  /* ----------- derive current page slice & totals ---------- */
  const total = visibleJobs.length;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * ITEMS_PER_PAGE;
  const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, total);
  const pageJobs = visibleJobs.slice(startIdx, endIdx);

  // 🔁 Reset to page 1 when criteria change
  useEffect(() => {
    setPage(1);
  }, [query, field, type, location, sortBy]);

  /* --------------------- time ago --------------------- */
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

  // 🔎 Only show the subheader when the user searched
  const hasSearch = useMemo(() => query.trim().length > 0, [query]);

  return (
    <div className="p-6 bg-[#ECF3FC] min-h-screen overflow-y-auto">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-900">
          Find Your Perfect <span className="text-[#F37526]">Internship</span>
        </h1>

        {hasSearch && (
          <p className="text-gray-600 mt-1" aria-live="polite">
            Found <span className="font-semibold">{visibleJobs.length}</span>{" "}
            result{visibleJobs.length === 1 ? "" : "s"} for “{query.trim()}”
          </p>
        )}
      </div>

      {/* SEARCH + FILTER BAR */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-3">
        {/* Search */}
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

      {/* ✅ SORT ROW (outside the search bar, right-aligned) */}
      <div className="my-5.5 w-full flex justify-end">
        <div className="inline-block">
          <SortByInline sortBy={sortBy} setSortBy={setSortBy} />
        </div>
      </div>

      {/* JOB CARDS */}
      {loading ? (
        <div className="text-center text-gray-600 mt-10">Loading job listings...</div>
      ) : visibleJobs.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">No job postings yet.</div>
      ) : (
        <>
          <div className="mt-4 space-y-4">
            {pageJobs.map((job) => {
              const company = job.companySnapshot || job.companyId || {};
              const companyId = company._id || job.companyId?._id || job.companyId || null;

              const snapshotRaw =
                company.profileImageUrl ||
                company.profileImage ||
                company.profilePhoto ||
                company.coverPhoto ||
                company.logo ||
                company.avatarUrl ||
                null;

              const fetchedUrl = companyId ? companyLogos[String(companyId)]?.url : "";
              const logo = buildImageUrl(snapshotRaw) || fetchedUrl || "";

              const companyDisplayName =
                company.companyName ||
                job.companySnapshot?.companyName ||
                job.companyName ||
                "Unknown Company";

              const logoKey = companyId || job._id || companyDisplayName;

              return (
                <div
                  key={job._id}
                  className="border border-blue-200 rounded-lg bg-white p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      {/* LOGO */}
                     {SHOW_COMPANY_LOGOS && logo && isValidImageUrl(logo) && !badLogos[logoKey] ? (
                        <div className="w-12 h-12 min-w-[48px] min-h-[48px] flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                          <img
                            src={logo}
                            alt={companyDisplayName}
                            className="w-full h-full object-cover object-center"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={() => setBadLogos((prev) => ({ ...prev, [logoKey]: true }))}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 min-w-[48px] min-h-[48px] flex-shrink-0 rounded-md bg-blue-900 text-white flex items-center justify-center font-bold text-lg">
                          {(companyDisplayName && companyDisplayName[0]?.toUpperCase()) || "C"}
                        </div>
                      )}

                      {/* JOB INFO */}
                      <div>
                        <h3 className="font-semibold text-blue-900 text-[16px]">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <span>{companyDisplayName}</span>
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
                        {timeAgo(
                          job.createdAt ||
                            job.created_at ||
                            job.postedAt ||
                            job.updatedAt
                        )}
                      </span>
                      <p className="text-blue-900 font-semibold text-lg">
                        {job.salaryMax || job.salary || "₱4000"}/month
                      </p>

                      <button
                        onClick={() =>
                          navigate(`/student/jobs/${job._id}`, {
                            state: { from: loc.pathname },
                          })
                        }
                        className="bg-[#F37526] hover:bg-[#e36210] text-white text-sm px-4 py-1.5 rounded-md font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 🔽 Pagination (active page indicator) */}
          <PaginationBar
            total={total}
            page={safePage}
            perPage={ITEMS_PER_PAGE}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

/* ---------------- Inline Sort trigger ---------------- */
function SortByInline({ sortBy, setSortBy }) {
  const [open, setOpen] = React.useState(false);

  const LABELS = {
    relevance: "Most Relevant",
    newest: "Most Recent",
    oldest: "Oldest",
    salary_desc: "Salary: High to Low",
    salary_asc: "Salary: Low to High",
    company_az: "Company A → Z",
  };

  const options = [
    { v: "newest", label: LABELS.newest },
    { v: "oldest", label: LABELS.oldest },
    { v: "relevance", label: LABELS.relevance },
    { v: "salary_desc", label: LABELS.salary_desc },
    { v: "salary_asc", label: LABELS.salary_asc },
    { v: "company_az", label: LABELS.company_az },
  ];

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!e.target.closest?.("#sortByInlineMenu")) setOpen(false);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [open]);

  return (
    <div className="relative select-none inline-block" id="sortByInlineMenu">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Filter className="w-4 h-4" />
        <span>
          <span className="text-slate-500">Sort by:</span>{" "}
          <span className="font-medium">{LABELS[sortBy] || "Most Recent"}</span>
        </span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-md border border-slate-200 bg-white shadow-lg z-50 overflow-hidden origin-top-right"
        >
          {options.map((opt) => {
            const active = opt.v === sortBy;
            return (
              <button
                key={opt.v}
                role="menuitem"
                onClick={() => {
                  setSortBy(opt.v);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
                  active ? "bg-slate-50 font-medium text-slate-900" : "text-slate-700"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- Pagination UI ---------------- */
function PaginationBar({ total, page, perPage, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;

  const startNum = (page - 1) * perPage + 1;
  const endNum = Math.min(startNum + perPage - 1, total);

  // Build a compact page list: 1 … (page-1, page, page+1) … last
  const pages = [];
  const push = (v) => pages.push(v);
  const addRange = (a, b) => {
    for (let i = a; i <= b; i++) push(i);
  };

  const left = Math.max(2, page - 1);
  const right = Math.min(totalPages - 1, page + 1);

  push(1);
  if (left > 2) push("…");
  addRange(left, right);
  if (right < totalPages - 1) push("…");
  if (totalPages > 1) push(totalPages);

  return (
    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="text-sm text-slate-600">
        Showing <span className="font-medium">{startNum}</span>–<span className="font-medium">{endNum}</span>{" "}
        of <span className="font-medium">{total}</span> jobs
      </div>

      <div className="flex items-center gap-1 select-none">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-md border ${
            page === 1
              ? "text-slate-400 border-slate-200 cursor-not-allowed"
              : "text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
          aria-label="Previous page"
        >
          <ChevronsLeft className="w-4 h-4" />
          Prev
        </button>

        {pages.map((p, idx) =>
          p === "…" ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={`p-${p}`}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={`min-w-[2rem] px-2 py-1.5 text-sm rounded-md border ${
                p === page
                  ? "bg-[#F37526] border-[#F37526] text-white font-medium"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-md border ${
            page === totalPages
              ? "text-slate-400 border-slate-200 cursor-not-allowed"
              : "text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
          aria-label="Next page"
        >
          Next
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
