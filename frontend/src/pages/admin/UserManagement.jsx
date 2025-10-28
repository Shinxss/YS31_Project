// src/pages/admin/UserManagementPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Search as SearchIcon, Loader2, Users, User, Building2 } from "lucide-react";

/* -------------------------------------------------------
   API base resolver
------------------------------------------------------- */
function resolveApiBase() {
  let raw = (import.meta.env?.VITE_API_BASE || "").trim();
  raw = raw.replace(/\/+$/, "");

  if (/^:/.test(raw)) {
    raw = `${window.location.protocol}//localhost${raw}`; // -> http://localhost:5000
  } else if (/^localhost(?::\d+)?$/.test(raw)) {
    raw = `${window.location.protocol}//${raw}`; // -> http://localhost:5000
  }

  if (!raw && typeof window !== "undefined" && /:5173|:5174/.test(window.location.origin)) {
    raw = "http://localhost:5000";
  }

  return raw;
}

const RAW_API_BASE = resolveApiBase();
const api = (p) => (RAW_API_BASE ? `${RAW_API_BASE}${p}` : p);

const API = {
  students: api("/api/admin/users/students"),
  companies: api("/api/admin/users/companies"),
  toggleStudentStatus: (id) => api(`/api/admin/users/students/${id}/status`),
  toggleCompanyStatus: (id) => api(`/api/admin/users/companies/${id}/status`),
  toggleCompanyVerification: (id) => api(`/api/admin/users/companies/${id}/verify`),
};

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */
const cls = (...xs) => xs.filter(Boolean).join(" ");
const normalize = (v = "") => String(v).trim().toLowerCase().replace(/\s+/g, " ");

const statusBadge = (raw) => {
  const s = normalize(raw);
  if (s.includes("active") || s === "enabled")
    return { label: "Active", className: "bg-emerald-100 text-emerald-700" };
  if (s.includes("disabled") || s.includes("blocked"))
    return { label: "Disabled", className: "bg-rose-100 text-rose-700" };
  return { label: raw || "Unknown", className: "bg-gray-100 text-gray-600" };
};

const formatDate = (value) => {
  const d = value ? new Date(value) : null;
  return d && !isNaN(d.getTime()) ? d.toLocaleDateString() : "—";
};

// tolerate different schema field names
const getStatus = (row) => row?.status ?? (row?.isDisabled ? "disabled" : "active");
const getCreatedAt = (row) => row?.accountCreatedAt || row?.createdAt || row?.dateJoined || row?.registeredAt;

/* -------------------------------------------------------
   Component
------------------------------------------------------- */
export default function UserManagementPage() {
  const [tab, setTab] = useState("all"); // all | students | companies
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  // fetch both when "all", otherwise only the active tab
  useEffect(() => {
    const abort = new AbortController();

    const loadStudents = async () => {
      const res = await fetch(API.students, { signal: abort.signal, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load students");
      return Array.isArray(data) ? data : data?.items || [];
    };

    const loadCompanies = async () => {
      const res = await fetch(API.companies, { signal: abort.signal, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load companies");
      return Array.isArray(data) ? data : data?.items || [];
    };

    (async () => {
      try {
        setError("");
        setLoading(true);
        if (tab === "students") {
          setStudents(await loadStudents());
        } else if (tab === "companies") {
          setCompanies(await loadCompanies());
        } else {
          const [s, c] = await Promise.all([loadStudents(), loadCompanies()]);
          setStudents(s);
          setCompanies(c);
        }
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    })();

    return () => abort.abort();
  }, [tab]);

  const allRows = useMemo(
    () => [
      ...students.map((s) => ({ ...s, __role: "student" })),
      ...companies.map((c) => ({ ...c, __role: "company" })),
    ],
    [students, companies]
  );

  const filtered = useMemo(() => {
    const q = normalize(query);
    const list = tab === "students" ? students : tab === "companies" ? companies : allRows;
    if (!q) return list;

    return list.filter((x) => {
      const isCompany = tab === "companies" || (tab === "all" && x.__role === "company");
      const name = normalize(
        isCompany ? x.companyName || x.name || "" : `${x.firstName || ""} ${x.lastName || ""}`.trim()
      );
      const email = normalize(x.email || x.contactEmail || "");
      const school = normalize(isCompany ? "" : x.school || "");
      const course = normalize(isCompany ? "" : x.course || "");
      const location = normalize(isCompany ? x.location || "" : "");
      const role = normalize(isCompany ? "company" : "student");

      return (
        name.includes(q) ||
        email.includes(q) ||
        school.includes(q) ||
        course.includes(q) ||
        location.includes(q) ||
        role.includes(q)
      );
    });
  }, [query, tab, students, companies, allRows]);

  const COLSPAN = tab === "all" ? 6 : 7;

  /* ----------------- Actions ----------------- */
  const handleToggle = async (row) => {
    try {
      setTogglingId(row._id);
      const isStudent = tab === "students" || (tab === "all" && row.__role === "student");
      const currentStatus = getStatus(row);
      const nextStatus =
        normalize(currentStatus).includes("disabled") || normalize(currentStatus) === "blocked"
          ? "active"
          : "disabled";

      // optimistic update
      if (isStudent) {
        setStudents((prev) => prev.map((x) => (x._id === row._id ? { ...x, status: nextStatus } : x)));
      } else {
        setCompanies((prev) => prev.map((x) => (x._id === row._id ? { ...x, status: nextStatus } : x)));
      }

      const res = await fetch(isStudent ? API.toggleStudentStatus(row._id) : API.toggleCompanyStatus(row._id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        // revert
        if (isStudent) {
          setStudents((prev) => prev.map((x) => (x._id === row._id ? { ...x, status: currentStatus } : x)));
        } else {
          setCompanies((prev) => prev.map((x) => (x._id === row._id ? { ...x, status: currentStatus } : x)));
        }
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to update status");
      }
    } catch (e) {
      setError(e.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleVerify = async (row) => {
    const isCompany = tab === "companies" || (tab === "all" && row.__role === "company");
    if (!isCompany || !row._id) return;

    setError("");
    setTogglingId(row._id);

    try {
      // optimistic
      setCompanies((prev) => prev.map((x) => (x._id === row._id ? { ...x, isVerified: !row.isVerified } : x)));

      const res = await fetch(API.toggleCompanyVerification(row._id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isVerified: !row.isVerified }),
      });

      if (!res.ok) {
        setCompanies((prev) => prev.map((x) => (x._id === row._id ? { ...x, isVerified: row.isVerified } : x)));
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to update verification status");
      }
    } catch (e) {
      setError(e.message || "Failed to update verification status");
    } finally {
      setTogglingId(null);
    }
  };

  /* ----------------- UI ----------------- */
  return (
    <div className="p-6">
      {/* Header row: title + right-aligned search (aligned baseline) */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">Manage students and companies</p>
        </div>

        <div className="w-full sm:w-auto">
          <div className="relative sm:min-w-[360px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Tabs like your screenshot */}
      <div className="mt-4 flex gap-3">
        {[
          { key: "all", label: "All", Icon: Users },
          { key: "students", label: "Students", Icon: User },
          { key: "companies", label: "Companies", Icon: Building2 },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cls(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition",
              tab === key
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            )}
            aria-pressed={tab === key}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="mt-4 bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                {tab === "all" ? (
                  <>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date Joined</th>
                  </>
                ) : tab === "students" ? (
                  <>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">School</th>
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date Joined</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Verified</th>
                    <th className="py-3 px-4">Date Joined</th>
                  </>
                )}
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={COLSPAN} className="py-10 text-center text-gray-500">
                    <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />
                    Loading {tab}…
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={COLSPAN} className="py-6 px-4">
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={COLSPAN} className="py-8 text-center text-gray-500">
                    No {tab === "all" ? "users" : tab} found.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                filtered.map((row, idx) => {
                  const isCompany = tab === "companies" || (tab === "all" && row.__role === "company");
                  const isStudent = !isCompany;

                  const displayName = isCompany
                    ? row.companyName || row.name || "—"
                    : `${row.firstName || ""} ${row.lastName || ""}`.trim() || row.name || "—";

                  const statusVal = getStatus(row);
                  const created = formatDate(getCreatedAt(row));

                  return (
                    <tr key={row._id || idx} className="border-b border-gray-100">
                      {tab === "all" ? (
                        <>
                          <td className="py-4 px-4">{displayName}</td>
                          <td className="py-4 px-4">{row.email || row.contactEmail || "—"}</td>
                          <td className="py-4 px-4 capitalize">{isCompany ? "Company" : "Student"}</td>
                          <td className="py-4 px-4">
                            <span className={cls("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium", statusBadge(statusVal).className)}>
                              {statusBadge(statusVal).label}
                            </span>
                          </td>
                          <td className="py-4 px-4">{created}</td>
                        </>
                      ) : isStudent ? (
                        <>
                          <td className="py-4 px-4">{displayName}</td>
                          <td className="py-4 px-4">{row.email}</td>
                          <td className="py-4 px-4">{row.school || "—"}</td>
                          <td className="py-4 px-4">{row.course || "—"}</td>
                          <td className="py-4 px-4">
                            <span className={cls("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium", statusBadge(statusVal).className)}>
                              {statusBadge(statusVal).label}
                            </span>
                          </td>
                          <td className="py-4 px-4">{created}</td>
                        </>
                      ) : (
                        <>
                          <td className="py-4 px-4">{displayName}</td>
                          <td className="py-4 px-4">{row.email}</td>
                          <td className="py-4 px-4">{row.location || "—"}</td>
                          <td className="py-4 px-4">
                            <span className={cls("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium", statusBadge(statusVal).className)}>
                              {statusBadge(statusVal).label}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={cls(
                                "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                                row.isVerified ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"
                              )}
                            >
                              {row.isVerified ? "Verified" : "Pending"}
                            </span>
                          </td>
                          <td className="py-4 px-4">{created}</td>
                        </>
                      )}

                      {/* Actions */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggle(row)}
                            disabled={togglingId === row._id}
                            className={cls(
                              "px-3 py-1.5 rounded-md text-xs font-medium border transition",
                              togglingId === row._id
                                ? "opacity-60 cursor-not-allowed"
                                : normalize(getStatus(row)).includes("disabled") || normalize(getStatus(row)) === "blocked"
                                ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                : "border-gray-200 text-gray-700 hover:bg-gray-50"
                            )}
                            title={
                              normalize(getStatus(row)).includes("disabled") || normalize(getStatus(row)) === "blocked"
                                ? "Enable"
                                : "Disable"
                            }
                          >
                            {togglingId === row._id ? (
                              <span className="inline-flex items-center">
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                Saving…
                              </span>
                            ) : normalize(getStatus(row)).includes("disabled") ||
                              normalize(getStatus(row)) === "blocked" ? (
                              "Enable"
                            ) : (
                              "Disable"
                            )}
                          </button>

                          {(tab === "companies" || (tab === "all" && isCompany)) && (
                            <button
                              onClick={() => handleVerify(row)}
                              disabled={togglingId === row._id}
                              className={cls(
                                "px-3 py-1.5 rounded-md text-xs font-medium border transition",
                                togglingId === row._id
                                  ? "opacity-60 cursor-not-allowed"
                                  : row.isVerified
                                  ? "border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                                  : "border-blue-200 text-blue-700 hover:bg-blue-50"
                              )}
                              title={row.isVerified ? "Remove Verification" : "Verify Company"}
                            >
                              {row.isVerified ? "Unverify" : "Verify"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
