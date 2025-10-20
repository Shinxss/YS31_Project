// src/pages/ApplicationsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ReviewApplicationModal from "../../components/dashboard/ReviewApplicationModal";

/* -------------------------------------------------------
   API base resolver (env first, fallback for Vite dev)
------------------------------------------------------- */
const RAW_API_BASE =
  (import.meta.env?.VITE_API_BASE ||
    (typeof window !== "undefined" && /:5173|:5174/.test(window.location.origin)
      ? "http://localhost:5000"
      : "")).trim();

const api = (p) => (RAW_API_BASE ? `${RAW_API_BASE}${p}` : p);

/* ------------------------------ */
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

const normalize = (v = "") => String(v).trim().toLowerCase().replace(/\s+/g, " ");

/* ------------------------------ */
export default function ApplicationsPage({ token: propToken }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rowBusy, setRowBusy] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  // Search / filter / sort (Student name)
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("default"); // default | name-asc | name-desc

  // 🔹 student profile cache: { [studentId]: { course, school, ... } }
  const [studentProfiles, setStudentProfiles] = useState({});

  const token =
    propToken ||
    (typeof window !== "undefined" ? localStorage.getItem("ic_token") : null);

  const authHeader = () => (token ? { Authorization: `Bearer ${token}` } : {});

  /* ------------------------------
   * API endpoints (company side)
   * ------------------------------ */
  const API = useMemo(
    () => ({
      listApplications: api("/api/company/applications"),
      reviewApplication: (id) => api(`/api/applications/${id}`),
      studentProfile: (studentId) => api(`/api/students/${studentId}/profile`),
      screeningAnswers: (appId) =>
        api(`/api/applications/${appId}/screening-answers`),
      applicantMessage: (appId) => api(`/api/applications/${appId}/message`),
    }),
    []
  );

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

      setApps(
        items.map((a) => ({ ...a, status: a.status || "New" }))
      );
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 🔹 Batch-fetch student profiles for displayed applications (to get `course`) */
  useEffect(() => {
    const ids = Array.from(
      new Set(
        apps
          .map((a) => a.student?._id)
          .filter(Boolean)
          .filter((id) => !studentProfiles[id])
      )
    );
    if (ids.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.all(
          ids.map((id) =>
            fetch(API.studentProfile(id), {
              credentials: "include",
              headers: { ...authHeader() },
            })
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null)
          )
        );
        if (cancelled) return;
        const next = { ...studentProfiles };
        ids.forEach((id, i) => {
          if (results[i]) next[id] = results[i];
        });
        setStudentProfiles(next);
      } catch {
        /* ignore profile fetch errors per-row */
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apps]);

  const statusLabel = (status) => {
    const s = normalize(status);
    if (s === "accepted") return ["Accepted", "bg-green-100 text-green-700"];
    if (s === "rejected") return ["Rejected", "bg-red-100 text-red-700"];
    if (s === "under review" || s === "under_review")
      return ["Under Review", "bg-yellow-100 text-yellow-800"];
    return ["New", "bg-indigo-100 text-indigo-700"];
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
        body: JSON.stringify({ status: "Under Review" }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      setApps((prev) =>
        prev.map((x) =>
          x._id === app._id ? { ...x, status: "Under Review" } : x
        )
      );

      const [profileRes, answersRes, msgRes] = await Promise.all([
        fetch(API.studentProfile(app.student?._id), {
          credentials: "include",
          headers: { ...authHeader() },
        }),
        fetch(API.screeningAnswers(app._id), {
          credentials: "include",
          headers: { ...authHeader() },
        }),
        fetch(API.applicantMessage(app._id), {
          credentials: "include",
          headers: { ...authHeader() },
        }),
      ]);

      const profile = profileRes.ok ? await profileRes.json() : null;
      const answersRaw = answersRes.ok ? await answersRes.json() : [];
      const messageRaw = msgRes.ok ? await msgRes.json() : null;

      let resume = null;
      if (app.resume) {
        resume = {
          url: api(`/uploads/resumes/${encodeURIComponent(app.resume)}`),
        };
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
            [app.student?.firstName, app.student?.lastName]
              .filter(Boolean)
              .join(" "),
        },
        job: { id: app.job?._id, title: app.job?.title },
        resume,
        answers: Array.isArray(answersRaw) ? answersRaw : answersRaw?.items || [],
        message:
          typeof messageRaw === "string" ? messageRaw : messageRaw?.text || "",
      });
      setDrawerOpen(true);
    } catch (e) {
      setError(e.message || "Unable to review application.");
    } finally {
      setRowBusy(null);
    }
  };

  /* ------------------------------
   * Filtering + sorting (Student name)
   * ------------------------------ */
  const filtered = useMemo(() => {
    const q = normalize(query);
    const s = normalize(statusFilter);

    return apps.filter((app) => {
      const studentName =
        app.student?.fullName ||
        [app.student?.firstName, app.student?.lastName]
          .filter(Boolean)
          .join(" ") ||
        "";
      const jobTitle = app.job?.title || "";

      const matchesQuery =
        !q ||
        studentName.toLowerCase().includes(q) ||
        jobTitle.toLowerCase().includes(q);

      const st = normalize(app.status || "new").replace("_", " ");
      const matchesStatus = s === "all" || st === s;

      return matchesQuery && matchesStatus;
    });
  }, [apps, query, statusFilter]);

  const filteredAndSorted = useMemo(() => {
    if (sortOrder === "default") return filtered;

    const list = [...filtered];
    list.sort((a, b) => {
      const an =
        (
          a.student?.fullName ||
          [a.student?.firstName, a.student?.lastName]
            .filter(Boolean)
            .join(" ") ||
          ""
        ).toLowerCase();
      const bn =
        (
          b.student?.fullName ||
          [b.student?.firstName, b.student?.lastName]
            .filter(Boolean)
            .join(" ") ||
          ""
        ).toLowerCase();
      const cmp = an.localeCompare(bn);
      return sortOrder === "name-asc" ? cmp : -cmp;
    });
    return list;
  }, [filtered, sortOrder]);

  const STATUS_OPTIONS = [
    { value: "all", label: "All statuses" },
    { value: "new", label: "New" },
    { value: "under review", label: "Under Review" },
    { value: "accepted", label: "Accepted" },
    { value: "rejected", label: "Rejected" },
  ];

  const SORT_OPTIONS = [
    { value: "default", label: "Default order" },
    { value: "name-asc", label: "Student A–Z" },
    { value: "name-desc", label: "Student Z–A" },
  ];

  /* ------------------------------ */
  return (
    <section className="bg-white rounded-2xl shadow-sm p-6 h-[600px] md:h-[670px] flex flex-col">
      <div className=" h-[640px] flex flex-col">
        {/* Header row (static) */}
        <div className="flex items-center justify-between mb-2 shrink-0">
          <h1 className="text-lg md:text-xl font-semibold text-gray-800">
            Applications
          </h1>
          {!loading && (
            <span className="text-sm text-gray-500">
              {filteredAndSorted.length} shown
              {filteredAndSorted.length !== apps.length
                ? ` of ${apps.length}`
                : ""}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-4 shrink-0">
          Review incoming student applications.
        </p>

        {/* Toolbar */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-12 gap-3 shrink-0">
          <div className="md:col-span-8">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by student or job title…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  title="Clear"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Sort
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm shrink-0">
            {error}
          </div>
        )}

        {/* Scrollable table container */}
        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-16 rounded-xl bg-gray-100" />
              <div className="h-16 rounded-xl bg-gray-100" />
              <div className="h-16 rounded-xl bg-gray-100" />
            </div>
          ) : apps.length === 0 ? (
            <div className="rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white text-center">
              <p className="text-gray-600">No applications yet.</p>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="rounded-xl p-4 border border-amber-200 bg-amber-50 text-amber-800 text-sm">
              No results match your current filters.
              <button
                className="ml-3 underline"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("all");
                  setSortOrder("default");
                }}
              >
                Reset
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-100 overflow-hidden h-full flex flex-col">
              {/* Sticky header */}
              <div className="hidden md:grid [grid-template-columns:5fr_4fr_1.6fr_1.4fr_1.4fr] gap-3 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-500 sticky top-0 z-10">
                <div>Student</div>
                <div>Job Title</div>
                <div>Applied On</div>
                <div>Status</div>
                <div className="text-right">Actions</div>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto">
                <ul className="divide-y divide-gray-100">
                  {filteredAndSorted.map((app) => {
                    const studentId = app.student?._id;
                    const fullName =
                      app.student?.fullName ||
                      [app.student?.firstName, app.student?.lastName]
                        .filter(Boolean)
                        .join(" ") ||
                      "Unknown Applicant";

                    const course =
                      (studentId && studentProfiles[studentId]?.course) || "—";

                    const jobTitle = app.job?.title || "—";
                    const [label, pillClass] = statusLabel(app.status);
                    const isBusy = rowBusy === app._id;

                    return (
                      <li
                        key={app._id}
                        className="px-4 py-4 bg-white hover:bg-gray-50 transition"
                      >
                        <div className="grid [grid-template-columns:5fr_4fr_1.6fr_1.4fr_1.4fr] gap-3 items-center">
                          {/* Student (avatar + name + COURSE under name) */}
                          <div className="min-w-0">
                            <div className="flex items-start gap-3">
                              <Initials name={fullName} />
                              <div className="min-w-0">
                                <h4 className="text-sm font-semibold text-gray-800 truncate">
                                  {fullName}
                                </h4>
                                {/* 🔹 Course shown here instead of job title */}
                                <p className="text-xs text-gray-500 truncate">
                                  {course}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Job Title (main col) */}
                          <div className="min-w-0">
                            <p className="text-sm text-gray-800 truncate max-w-full">
                              {jobTitle}
                            </p>
                          </div>

                          {/* Applied On */}
                          <div className="text-xs text-gray-600">
                            {timeAgo(app.appliedAt || app.createdAt)}
                          </div>

                          {/* Status */}
                          <div>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${pillClass} whitespace-nowrap`}
                            >
                              {label}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex justify-end gap-2 whitespace-nowrap">
                            <Link
                              to={`/students/${app.student?._id || ""}`}
                              className="px-2.5 py-1.5 rounded-lg border text-gray-700 hover:bg-gray-50 text-xs"
                            >
                              View
                            </Link>
                            <button
                              disabled={isBusy}
                              onClick={() => handleReview(app)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#1337B6] text-white hover:bg-[#0F2FA0] text-xs disabled:opacity-60"
                            >
                              {isBusy ? "…" : "Review"}
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Review modal (kept) */}
        <ReviewApplicationModal
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          application={selected}
          onStatusChange={(status, id) => {
            setApps((prev) =>
              prev.map((a) => (a._id === id ? { ...a, status } : a))
            );
          }}
        />
      </div>
    </section>
  );
}
