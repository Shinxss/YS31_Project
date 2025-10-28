// src/components/studentDashboard/StudentHeaderBar.jsx
import React, { useEffect, useRef, useState } from "react";
import { Bell, PanelLeft, CheckCircle2, Loader2 } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:5000").replace(/\/+$/, "");
const PERM_TYPE = "status";
const ALLOWED_STATUSES = new Set(["Accepted", "Rejected"]);

/* ---------------- utils ---------------- */
function getInitials(name) {
  return (
    String(name || "")
      .trim()
      .split(/\s+/)
      .map((n) => n[0]?.toUpperCase() || "")
      .slice(0, 2)
      .join("") || "U"
  );
}
function timeAgoPretty(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} mins`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hrs`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} days`;
  return new Date(iso).toLocaleString();
}
function Chip({ children, intent = "default" }) {
  const map = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-200 text-green-800",
    danger: "bg-red-200 text-red-800",
    info: "bg-blue-200 text-blue-800",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${map[intent]}`}>
      {children}
    </span>
  );
}
// remove a trailing " — Company" suffix if backend adds it
function cleanBodyTail(str) {
  const t = String(str || "");
  return t.replace(/\s+—\s+[A-Za-z0-9 .,&-]+$/, "");
}

/* ---------------- popover ---------------- */
function StudentNotifPopover({ open, onClose }) {
  const panelRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("ic_token") : null;

  const unreadCount = items.filter((n) => !n?.isRead).length;

  // close on outside / ESC
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target)) onClose?.();
    };
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  async function fetchList({ spinner = true } = {}) {
    if (!open) return;
    spinner ? setLoading(true) : setRefreshing(true);
    try {
      const url = `${API_BASE}/api/student/notifications?limit=10&page=1&type=${encodeURIComponent(
        PERM_TYPE
      )}&statuses=${encodeURIComponent("Accepted,Rejected")}`;
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load");

      const list = Array.isArray(data) ? data : data.notifications || [];
      const filtered = list.filter(
        (n) => String(n?.type || "").toLowerCase() === PERM_TYPE && ALLOWED_STATUSES.has(n?.status || n?.data?.status)
      );

      setItems(filtered);
    } catch (e) {
      console.warn("student notif load failed:", e.message);
      setItems([]);
    } finally {
      spinner ? setLoading(false) : setRefreshing(false);
    }
  }

  useEffect(() => {
    if (open) fetchList({ spinner: true });
  }, [open]); // eslint-disable-line

  // poll while open
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => fetchList({ spinner: false }), 30_000);
    return () => clearInterval(id);
  }, [open]); // eslint-disable-line

  async function markRead(id) {
    try {
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      const r = await fetch(`${API_BASE}/api/student/notifications/${id}/read`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!r.ok) throw new Error();
    } catch {
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: false } : n)));
    }
  }

  async function markAllRead() {
    try {
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await fetch(`${API_BASE}/api/student/notifications/read-all`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      fetchList({ spinner: false });
    }
  }

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 w-[340px] max-h-[70vh] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-[60] overflow-x-hidden"
    >
      {/* header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
        <div className="text-[13px] font-semibold">Notifications</div>
        <button onClick={markAllRead} className="text-[12px] text-blue-700 hover:underline">
          Mark all as read
        </button>
      </div>

      {/* content */}
      <div className="relative">
        {loading ? (
          <div className="p-3 grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse p-3 rounded-xl border bg-white shadow-sm">
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-[12px] text-gray-500 text-center">No accepted/rejected notifications yet</div>
        ) : (
          <div className="p-3 max-h-[60vh] overflow-y-auto overflow-x-hidden grid gap-3">
            {items.map((n) => {
              const isUnread = !n?.isRead;
              const jobTitle = n?.data?.jobTitle || "—";
              const companyName = n?.data?.companyName || "Company";
              const status = n?.status || n?.data?.status || "Update";
              const statusIntent = status === "Accepted" ? "success" : status === "Rejected" ? "danger" : "info";
              const title = `Application ${status}`;

              const rawBody =
                n?.body ||
                (status === "Accepted"
                  ? `Hi ${n?.data?.studentName || "there"}, your application for ${jobTitle} in ${companyName} has been accepted.`
                  : status === "Rejected"
                  ? `Hi ${n?.data?.studentName || "there"}, your application for ${jobTitle} in ${companyName} has been rejected.`
                  : `Update on your application for ${jobTitle} at ${companyName}.`);
              const body = cleanBodyTail(rawBody);

              return (
                <div
                  key={n._id}
                  className={`relative rounded-xl border shadow-sm hover:shadow-md transition hover:-translate-y-0.5 p-3 break-words 
                    ${isUnread ? "bg-orange-50" : "bg-gray-100"}`} // orange for unread, gray for read
                >
                  {/* grid: avatar + title row; body starts on column 2 to align with logo edge */}
                  <div className="grid grid-cols-[2.25rem_1fr] gap-3 items-start">
                    {/* avatar */}
                    <div className="col-span-1">
                      {n?.data?.companyLogo ? (
                        <img
                          src={n.data.companyLogo}
                          alt="Company"
                          className="w-9 h-9 rounded-full object-cover bg-gray-100"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-700 text-[12px] font-semibold grid place-items-center">
                          {getInitials(companyName || jobTitle)}
                        </div>
                      )}
                    </div>

                    {/* header row */}
                    <div className="col-span-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0">
                          <div className={`text-[14px] font-semibold text-gray-900 leading-tight ${isUnread ? "font-bold" : ""}`}>
                            {title}
                          </div>
                          <div className="mt-1">
                            <Chip intent={statusIntent}>{status}</Chip>
                          </div>
                        </div>
                        <div className={`ml-auto text-[11px] text-gray-500 ${isUnread ? "font-bold" : ""}`}>
                          {timeAgoPretty(n.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* message aligned with logo column */}
                    <div className="col-span-2 text-[13px] text-gray-800 leading-snug">
                      {body}
                    </div>

                    {/* actions (left-aligned under message) */}
                    <div className="col-span-2 flex items-center gap-3">
                      {n?.data?.jobId && (
                        <a
                          href={`/student/jobs/${n.data.jobId}`}
                          onClick={onClose}
                          className="inline-flex items-center justify-center px-4 py-2 text-[10px] font-medium rounded-md shadow-md bg-orange-500 text-white hover:bg-orange-600"
                          title="View job"
                        >
                          View job
                        </a>
                      )}

                      {/* Show Read button only when UNREAD */}
                      {isUnread && (
                        <button
                          onClick={() => markRead(n._id)}
                          className="inline-flex items-center justify-center gap-1 px-4 py-2 text-[13px] font-medium rounded-md border bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                          title="Mark as read"
                        >
                          <CheckCircle2 size={14} />
                          Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {refreshing && (
          <div className="absolute top-2 right-2 text-gray-500">
            <Loader2 size={16} className="animate-spin" />
          </div>
        )}
      </div>

      {/* footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50">
        <div className="text-[11px] text-gray-500">
          Unread: <span className="font-medium">{unreadCount}</span>
        </div>
        <a href="/student/notifications" className="text-[12px] text-blue-700 hover:underline" onClick={onClose}>
          View all →
        </a>
      </div>
    </div>
  );
}

/* ---------------- header bar ---------------- */
export default function StudentHeaderBar({
  student = { firstName: "", lastName: "", course: "", profilePicture: "" },
  onToggleSidebar,
  title = "Dashboard",
}) {
  const fullName = `${student.firstName || ""} ${student.lastName || ""}`.trim();

  const [openPopover, setOpenPopover] = useState(false);
  const [unreadBadge, setUnreadBadge] = useState(0);
  const token = typeof window !== "undefined" ? localStorage.getItem("ic_token") : null;

  async function refreshBadge() {
    try {
      const url = `${API_BASE}/api/student/notifications?limit=20&page=1&type=${encodeURIComponent(
        PERM_TYPE
      )}&statuses=${encodeURIComponent("Accepted,Rejected")}`;
      const r = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const j = await r.json();
      if (!r.ok) throw new Error();
      const list = Array.isArray(j) ? j : j.notifications || [];
      const filtered = list.filter(
        (n) => String(n?.type || "").toLowerCase() === PERM_TYPE && ALLOWED_STATUSES.has(n?.status || n?.data?.status)
      );
      const unread = filtered.filter((n) => !n?.isRead).length;
      setUnreadBadge(unread);
    } catch {
      /* keep last */
    }
  }
  useEffect(() => {
    refreshBadge();
    const id = setInterval(refreshBadge, 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <header className="relative h-16 bg-[#173B8A] text-white flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="w-8 h-8 rounded border border-white/30 grid place-items-center hover:bg-white/10 transition"
          title="Toggle sidebar"
          aria-label="Toggle sidebar"
          type="button"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        <div className="text-xl font-bold leading-none">{title}</div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <button
            className="relative hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/40 rounded p-1"
            title="Notifications"
            type="button"
            onClick={() => setOpenPopover((v) => !v)}
            aria-label={`Notifications${unreadBadge > 0 ? ": unread" : ""}`}
          >
            <Bell className="w-5 h-5" />
            {unreadBadge > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#173B8A] animate-pulse"
                aria-hidden="true"
              />
            )}
          </button>

          <StudentNotifPopover
            open={openPopover}
            onClose={() => {
              setOpenPopover(false);
              setTimeout(refreshBadge, 400);
            }}
          />
        </div>

        <div className="flex items-center gap-3 min-w-0">
          {student?.profilePicture ? (
            <img
              src={student.profilePicture}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border-2 border-white shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded bg-white/80 text-[#173B8A] font-semibold grid place-items-center shrink-0">
              {getInitials(fullName || "Student")}
            </div>
          )}
          <div className="leading-tight text-left min-w-0">
            <div className="font-medium truncate">{fullName || "Student"}</div>
            <div className="text-xs text-white/80 truncate">{student.course || "No Course"}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
