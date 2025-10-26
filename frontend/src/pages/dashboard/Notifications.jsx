import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Mail,
  Trash2,
  RefreshCw,
  Loader2,
  Filter,
} from "lucide-react";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const PAGE_SIZE = 20;

/** permanent constraints */
const PERM_TYPE = "application";
const PERM_STATUS = "Applied";

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleString();
}

function Chip({ children, intent = "default" }) {
  const map = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
    warn: "bg-amber-100 text-amber-700",
    info: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[intent]}`}>
      {children}
    </span>
  );
}

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  // Only two views now because everything is already filtered to "Applied" applications
  const [filter, setFilter] = useState("all"); // all | unread

  const token = localStorage.getItem("ic_token");

  // client-side hard filter (defensive in case backend ignores query params)
  const baseAppliedOnly = useMemo(() => {
    return (items || []).filter(
      (n) =>
        (n?.type?.toLowerCase?.() === PERM_TYPE) &&
        ((n?.status === PERM_STATUS) || (n?.data?.status === PERM_STATUS))
    );
  }, [items]);

  const filtered = useMemo(() => {
    let data = baseAppliedOnly;
    if (filter === "unread") data = data.filter((n) => !n.isRead);
    return data;
  }, [baseAppliedOnly, filter]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function fetchNotifications({ showSpinner = true } = {}) {
    if (!token) {
      setError("Not authenticated.");
      return;
    }
    try {
      showSpinner ? setLoading(true) : setRefreshing(true);
      setError("");

      // Add permanent query filters to only fetch "Applied" application notifications
      const url = `${API_BASE}/api/company/notifications?limit=${PAGE_SIZE}&page=${page}&type=${encodeURIComponent(
        PERM_TYPE
      )}&status=${encodeURIComponent(PERM_STATUS)}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load notifications");

      const list = Array.isArray(data) ? data : data.notifications || [];

      // Defensive: enforce the same hard filter client-side
      const appliedOnly = list.filter(
        (n) =>
          (n?.type?.toLowerCase?.() === PERM_TYPE) &&
          ((n?.status === PERM_STATUS) || (n?.data?.status === PERM_STATUS))
      );

      setItems(appliedOnly);

      // total from API if provided, else fallback
      setTotal(
        typeof data.total === "number"
          ? data.total
          : appliedOnly.length < PAGE_SIZE && page === 1
          ? appliedOnly.length
          : page * PAGE_SIZE
      );
    } catch (e) {
      console.error("load notifications error:", e);
      setError(e.message || "Failed to load notifications");
      toast.error(e.message || "Failed to load notifications");
    } finally {
      showSpinner ? setLoading(false) : setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchNotifications({ showSpinner: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function markRead(id) {
    try {
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      const res = await fetch(`${API_BASE}/api/company/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to mark as read");
      }
    } catch (e) {
      toast.error(e.message);
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: false } : n)));
    }
  }

  async function markAllRead() {
    try {
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      const res = await fetch(`${API_BASE}/api/company/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to mark all as read");
      }
      toast.success("All notifications marked as read.");
    } catch (e) {
      toast.error(e.message);
      fetchNotifications({ showSpinner: false });
    }
  }

  async function removeOne(id) {
    try {
      setItems((p) => p.filter((n) => n._id !== id));
      const res = await fetch(`${API_BASE}/api/company/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Delete failed");
      }
      toast.success("Notification removed.");
      fetchNotifications({ showSpinner: false });
    } catch (e) {
      toast.error(e.message);
      fetchNotifications({ showSpinner: false });
    }
  }

  const Skeleton = () => (
    <div className="animate-pulse p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
      <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/4" />
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Bell className="text-blue-700" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">
              Showing only <span className="font-medium">Applied</span> application alerts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchNotifications({ showSpinner: false })}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
            disabled={refreshing}
            title="Refresh"
          >
            {refreshing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            <span className="text-sm">Refresh</span>
          </button>
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            <CheckCircle2 size={16} />
            <span className="text-sm">Mark all read</span>
          </button>
        </div>
      </div>

      {/* Filters (limited to All / Unread since we hard-filter to Applied applications) */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-2 px-2 py-1 text-gray-600">
          <Filter size={16} />
          <span className="text-sm">View:</span>
        </div>
        {[
          { key: "all", label: "All (Applied)" },
          { key: "unread", label: "Unread (Applied)" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-md text-sm border ${
              filter === f.key
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-100">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-10 border border-dashed border-gray-300 rounded-xl text-center bg-gray-50">
          <Bell className="mx-auto mb-2" />
          <p className="font-medium text-gray-800">No “Applied” application notifications</p>
          <p className="text-sm text-gray-500">You’ll see new applicant submissions here.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((n) => {
            const tagIntent = "info"; // all are "Applied"
            const jobTitle = n?.data?.jobTitle || "—";

            // Prefer the stored name; fallback to parsing from title pattern.
            let applicantName = n?.data?.applicantName || null;
            if (!applicantName && typeof n?.title === "string") {
              const m = n.title.match(/New applicant\s+—\s+(.*?)\s+for\s+/i);
              if (m && m[1]) applicantName = m[1].trim();
            }
            const displayTitle =
              n?.title || `New applicant — ${applicantName || "Applicant"} for ${jobTitle}`;

            const applicantEmail = n?.data?.applicantEmail || null;

            return (
              <div
                key={n._id}
                className={`p-4 bg-white rounded-xl shadow-sm border ${
                  n.isRead ? "border-gray-100" : "border-blue-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                        {displayTitle}
                      </h3>
                      <Chip intent={tagIntent}>{PERM_STATUS}</Chip>
                      <Chip>application</Chip>
                      {!n.isRead && <Chip intent="info">New</Chip>}
                    </div>

                    <p className="text-sm text-gray-700 mt-1">
                      {n?.body || `Heads up, ${applicantName || "the applicant"} applied for ${jobTitle}.`}
                    </p>

                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                      {applicantName && (
                        <span>
                          Applicant: <span className="font-medium text-gray-700">{applicantName}</span>
                        </span>
                      )}

                      {applicantEmail && (
                        <span className="inline-flex items-center gap-1">
                          <Mail size={14} />
                          <a href={`mailto:${applicantEmail}`} className="hover:underline">
                            {applicantEmail}
                          </a>
                        </span>
                      )}

                      <span>{timeAgo(n.createdAt)}</span>
                    </div>

                    {n?.data?.jobId && (
                      <div className="mt-3">
                        <a
                          href={`/company/applications?job=${n.data.jobId}`}
                          className="text-sm text-blue-700 hover:underline"
                        >
                          View applicants for this job →
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!n.isRead && (
                      <button
                        onClick={() => markRead(n._id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50 text-sm"
                        title="Mark as read"
                      >
                        <CheckCircle2 size={16} />
                        Read
                      </button>
                    )}
                    <button
                      onClick={() => removeOne(n._id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50 text-sm text-red-600"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {pageCount}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-md border border-gray-200 bg-white disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
              className="px-3 py-1.5 rounded-md border border-gray-200 bg-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
