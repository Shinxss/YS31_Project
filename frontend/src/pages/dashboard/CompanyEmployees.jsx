// src/pages/company/CompanyEmployees.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * CompanyEmployees page
 *
 * Fetches company_employees documents and flattens their `employees` arrays.
 * Adapt the API path below if your backend route differs.
 */

const RAW_API_BASE =
  (import.meta.env?.VITE_API_BASE ||
    (typeof window !== "undefined" && /:5173|:5174/.test(window.location.origin)
      ? "http://localhost:5000"
      : "")).trim();
const api = (p) => (RAW_API_BASE ? `${RAW_API_BASE}${p}` : p);

const API = {
  // Update this if your backend uses a different path
  companyEmployees: api("/api/company/employees"),
};

const authHeader = () => {
  const token =
    (typeof window !== "undefined" && localStorage.getItem("ic_company_token")) ||
    (typeof window !== "undefined" && localStorage.getItem("ic_token")) ||
    null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const Avatar = ({ src, name }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name || "avatar"}
        className="h-10 w-10 rounded-full object-cover border border-gray-200"
      />
    );
  }
  const initials = (name || "")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
      {initials || "?"}
    </div>
  );
};

function normalizeEmployee(raw, companyId) {
  // raw may be { firstName, lastName, email, role, createdAt, profilePicture }
  // or it may already be a user doc; be defensive
  const firstName = raw.firstName || raw.first_name || raw.fname || "";
  const lastName = raw.lastName || raw.last_name || raw.lname || raw.last || "";
  const fullName =
    raw.fullName ||
    raw.name ||
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    raw.displayName ||
    "";
  const email = raw.email || raw.userEmail || raw.mail || "";
  const role = raw.role || raw.position || raw.title || "";
  const createdAt = raw.createdAt || raw.joinedAt || raw.created_at || raw.addedAt || raw.added_at;
  const profilePicture = raw.profilePicture || raw.avatar || raw.photo || raw.profileImage || "";
  // id: prefer _id or id if present; else create a stable synthetic id using companyId + email
  const id = raw._id || raw.id || (companyId ? `${companyId}:${email}` : email || Math.random().toString(36).slice(2));
  return {
    _id: id,
    companyId: companyId || raw.companyId || raw.company?._id,
    firstName,
    lastName,
    fullName,
    email,
    role,
    createdAt,
    profilePicture,
    raw,
  };
}

export default function CompanyEmployees() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [employees, setEmployees] = useState([]);
  const [query, setQuery] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(API.companyEmployees, {
          credentials: "include",
          headers: { ...authHeader() },
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.message || `Failed to fetch (${res.status})`);
        }
        const json = await res.json();

        // Flatten logic:
        // possible shapes:
        // 1) array of company docs: [{ _id, companyName, employees: [ ... ] }, ...]
        // 2) single company doc: { _id, companyName, employees: [...] }
        // 3) array of employee objects: [{ firstName, email, ... }, ...]
        // 4) wrapper object: { items: [...companies] } or { data: [...] } etc.

        let companyDocs = [];
        const ensureArr = (v) => (Array.isArray(v) ? v : v ? [v] : []);

        if (Array.isArray(json)) {
          // could be array of companies OR array of employees
          // Heuristic: if first element has 'employees' array or 'companyName' treat as companies
          const first = json[0];
          if (first && (Array.isArray(first.employees) || first.companyName || first.owner)) {
            companyDocs = json;
          } else {
            // treat as plain employees list (shape #3)
            const emps = json.map((r) => normalizeEmployee(r, null));
            if (!cancelled) setEmployees(emps);
            return;
          }
        } else if (json && typeof json === "object") {
          // check nested keys
          if (Array.isArray(json.items) && json.items.length && (json.items[0].employees || json.items[0].companyName)) {
            companyDocs = json.items;
          } else if (Array.isArray(json.data) && json.data.length && (json.data[0].employees || json.data[0].companyName)) {
            companyDocs = json.data;
          } else if (Array.isArray(json.employees) && (json.companyName || json._id)) {
            // single company doc returned directly
            companyDocs = [json];
          } else if (json.company || json.companyEmployees || (json._id && Array.isArray(json.employees))) {
            companyDocs = [json];
          } else if (Array.isArray(json.employees) && !json.companyName) {
            // shape: { employees: [...] }
            const emps = (json.employees || []).map((r) => normalizeEmployee(r, json._id || null));
            if (!cancelled) setEmployees(emps);
            return;
          } else {
            // fallback: maybe object with employees inside items
            const nestedCompanies = json.items || json.data || [];
            if (nestedCompanies.length && nestedCompanies[0].employees) companyDocs = nestedCompanies;
            else {
              // unknown - try to extract any employees arrays from values
              const collected = [];
              Object.values(json).forEach((v) => {
                if (Array.isArray(v) && v.length && (v[0].email || v[0].firstName || v[0].employees)) {
                  // if nested arrays contain employee objects or companies
                  if (v[0].employees || v[0].companyName) {
                    collected.push(...v);
                  } else {
                    collected.push(...v.map((r) => normalizeEmployee(r, null)));
                  }
                }
              });
              if (collected.length) {
                if (!cancelled) setEmployees(collected);
                return;
              }
            }
          }
        }

        // now companyDocs should be an array of company documents that have `.employees`
        const flat = [];
        for (const c of ensureArr(companyDocs)) {
          const cid = c._id || c.id || c.companyId || null;
          const emps = Array.isArray(c.employees) ? c.employees : [];
          for (const rawEmp of emps) {
            flat.push(normalizeEmployee(rawEmp, cid));
          }
        }

        if (!cancelled) setEmployees(flat);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load employees");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // close menu on outside click
  useEffect(() => {
    const onDoc = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => {
      return (
        (e.fullName || "").toLowerCase().includes(q) ||
        (e.email || "").toLowerCase().includes(q) ||
        (e.role || "").toLowerCase().includes(q)
      );
    });
  }, [employees, query]);

  return (
    <div className="bg-[#F5F7FD] min-h-[calc(100vh-60px)] p-6">
      <div className="max-w-[1100px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Employees</h1>
          <div>
            {/* Button only navigates — doesn't create anything by itself */}
            <button
              onClick={() => navigate("/company/employees/new")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0B63F8] text-white shadow-sm text-sm"
            >
              + Add Employee
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 w-full max-w-lg">
              <span className="text-gray-400">🔍</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email or role..."
                className="w-full outline-none text-sm"
              />
            </div>
          </div>

          {err && <div className="text-sm text-red-600 mb-3">{err}</div>}

          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading employees…</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No employees found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="text-xs text-gray-600">
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Role</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left hidden lg:table-cell">Company ID</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filtered.map((e) => (
                    <tr key={e._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar src={e.profilePicture} name={e.fullName || e.email} />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {e.fullName || "—"}
                            </div>
                            <div className="text-xs text-gray-500 truncate">{e.role || ""}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top hidden md:table-cell">
                        <div className="text-sm text-gray-700">{e.role || "—"}</div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="text-sm text-gray-700 truncate max-w-[220px]">{e.email || "—"}</div>
                      </td>

                      <td className="px-4 py-4 align-top hidden lg:table-cell">
                        <div className="text-sm text-gray-700 break-all">{String(e.companyId || "—")}</div>
                      </td>

                      <td className="px-4 py-4 align-top text-right relative" ref={menuRef}>
                        <div className="inline-flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setOpenMenu((cur) => (cur === e._id ? null : e._id))}
                            className="p-2 rounded hover:bg-gray-100"
                            aria-label="Actions"
                          >
                            ⋯
                          </button>
                        </div>

                        {openMenu === e._id && (
                          <div className="absolute right-4 top-10 w-44 rounded-md border bg-white shadow-md z-10 text-sm">
                            <button
                              onClick={() => {
                                setOpenMenu(null);
                                // view route: company + employee id/email
                                navigate(
                                  `/company/employees/view?companyId=${encodeURIComponent(
                                    e.companyId || ""
                                  )}&email=${encodeURIComponent(e.email || "")}`
                                );
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50"
                            >
                              View Profile
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenu(null);
                                navigate(
                                  `/company/employees/edit?companyId=${encodeURIComponent(
                                    e.companyId || ""
                                  )}&email=${encodeURIComponent(e.email || "")}`
                                );
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
