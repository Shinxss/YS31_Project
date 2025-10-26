// src/pages/admin/UserManagementPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Search, Loader2 } from "lucide-react";

/* -------------------------------------------------------
   API base resolver (Vite env first; dev fallback)
------------------------------------------------------- */
/* ---------- API base (robust) ---------- */
function resolveApiBase() {
  let raw = (import.meta.env?.VITE_API_BASE || "").trim();

  // strip trailing slash
  raw = raw.replace(/\/+$/, "");

  // If someone set ":5000" or "localhost:5000", fix it.
  if (/^:/.test(raw)) {
    raw = `${window.location.protocol}//localhost${raw}`; // -> http://localhost:5000
  } else if (/^localhost(?::\d+)?$/.test(raw)) {
    raw = `${window.location.protocol}//${raw}`; // -> http://localhost:5000
  }

  // Dev fallback when empty
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
};

/* -------------------------------------------------------
   Small helpers
------------------------------------------------------- */
const cls = (...xs) => xs.filter(Boolean).join(" ");
const normalize = (v = "") => String(v).trim().toLowerCase().replace(/\s+/g, " ");

/** statusBadge - maps status to label + tailwind classes */
const statusBadge = (raw) => {
  const s = normalize(raw);
  if (s.includes("active") || s === "enabled")
    return { label: "Active", className: "bg-emerald-100 text-emerald-700" };
  if (s.includes("disabled") || s.includes("blocked"))
    return { label: "Disabled", className: "bg-rose-100 text-rose-700" };
  return { label: raw || "Unknown", className: "bg-gray-100 text-gray-600" };
};

/* -------------------------------------------------------
   Main Page
------------------------------------------------------- */
export default function UserManagementPage() {
  const [tab, setTab] = useState("students"); // "students" | "companies"
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  // Fetch lists
  useEffect(() => {
    let abort = new AbortController();
    (async () => {
      try {
        setError("");
        setLoading(true);
        if (tab === "students") {
          const res = await fetch(API.students, { signal: abort.signal, credentials: "include" });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.message || "Failed to load students");
          setStudents(Array.isArray(data) ? data : data?.items || []);
        } else {
          const res = await fetch(API.companies, { signal: abort.signal, credentials: "include" });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.message || "Failed to load companies");
          setCompanies(Array.isArray(data) ? data : data?.items || []);
        }
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    })();
    return () => abort.abort();
  }, [tab]);

  // Client-side search
  const filtered = useMemo(() => {
    const q = normalize(query);
    const list = tab === "students" ? students : companies;
    if (!q) return list;
    return list.filter((x) => {
      const name = normalize(x.name || x.fullName || x.companyName || "");
      const school = normalize(x.school || "");
      const email = normalize(x.email || x.contactEmail || "");
      const major = normalize(x.major || "");
      const location = normalize(x.location || "");
      return (
        name.includes(q) ||
        school.includes(q) ||
        email.includes(q) ||
        major.includes(q) ||
        location.includes(q)
      );
    });
  }, [query, students, companies, tab]);

  // Toggle Enable/Disable (optimistic)
  const handleToggle = async (row) => {
    try {
      setTogglingId(row._id);
      const isStudent = tab === "students";
      const nextStatus =
        normalize(row.status).includes("disabled") || normalize(row.status) === "blocked"
          ? "active"
          : "disabled";

      // optimistic update
      if (isStudent) {
        setStudents((prev) =>
          prev.map((x) => (x._id === row._id ? { ...x, status: nextStatus } : x))
        );
      } else {
        setCompanies((prev) =>
          prev.map((x) => (x._id === row._id ? { ...x, status: nextStatus } : x))
        );
      }

      const res = await fetch(
        isStudent ? API.toggleStudentStatus(row._id) : API.toggleCompanyStatus(row._id),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: nextStatus }),
        }
      );
      if (!res.ok) {
        // revert on failure
        if (isStudent) {
          setStudents((prev) =>
            prev.map((x) => (x._id === row._id ? { ...x, status: row.status } : x))
          );
        } else {
          setCompanies((prev) =>
            prev.map((x) => (x._id === row._id ? { ...x, status: row.status } : x))
          );
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
      <p className="text-sm text-gray-500">
        Manage students and companies accounts
      </p>

      {/* Tabs */}
      <div className="mt-4 bg-white border border-gray-200 rounded-xl">
        <div className="flex gap-2 p-2">
          {["students", "companies"].map((t) => (
            <button
              key={t}
              className={cls(
                "px-4 py-2 rounded-lg text-sm font-medium transition",
                tab === t
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
              onClick={() => setTab(t)}
            >
              {t === "students" ? "Students" : "Companies"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-3 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === "students" ? "Search students..." : "Search companies..."}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200" />

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">{tab === "students" ? "School" : "Location"}</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-500">
                    <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />
                    Loading {tab}…
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={5} className="py-6 px-4">
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No {tab} found.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                filtered.map((row, idx) => {
                  const isLast = idx === filtered.length - 1;
                  const badge = statusBadge(row.status);
                  const name =
                    row.name || row.fullName || row.companyName || "—";
                  const schoolOrLoc =
                    tab === "students" ? row.school || "—" : row.location || "—";
                  const email = row.email || row.contactEmail || "—";
                  const isDisabled = normalize(row.status).includes("disabled") || normalize(row.status)==="blocked";

                  return (
                    <tr key={row._id || idx} className={cls(!isLast && "border-b border-gray-100")}>
                      <td className="py-4 px-4">{name}</td>
                      <td className="py-4 px-4">{schoolOrLoc}</td>
                      <td className="py-4 px-4">{email}</td>
                      <td className="py-4 px-4">
                        <span
                          className={cls(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                            badge.className
                          )}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleToggle(row)}
                          disabled={togglingId === row._id}
                          className={cls(
                            "px-3 py-1.5 rounded-md text-xs font-medium border transition",
                            togglingId === row._id
                              ? "opacity-60 cursor-not-allowed"
                              : isDisabled
                              ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              : "border-gray-200 text-gray-700 hover:bg-gray-50"
                          )}
                          title={isDisabled ? "Enable" : "Disable"}
                        >
                          {togglingId === row._id ? (
                            <span className="inline-flex items-center">
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              Saving…
                            </span>
                          ) : isDisabled ? (
                            "Enable"
                          ) : (
                            "Disable"
                          )}
                        </button>
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
