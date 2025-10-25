import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bell, PanelLeft, CheckCircle2, Loader2 } from "lucide-react";

/* ---------------- utilities ---------------- */
function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}
function toImageUrl(raw, API_BASE) {
  if (!raw) return "";
  const v = String(raw).trim();
  if (/^https?:\/\//i.test(v)) return v;
  const base = (API_BASE || "").replace(/\/+$/, "");
  return `${base}/uploads/company/${encodeURIComponent(v)}`;
}
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

/* -------------- tiny chip --------------- */
function Chip({ children, intent = "default" }) {
  const map = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
    warn: "bg-amber-100 text-amber-700",
    info: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${map[intent]}`}>
      {children}
    </span>
  );
}

/* -------------- Notification popover --------------- */
function NotificationPopover({ open, onClose, API_BASE, getAuthHeaders }) {
  const panelRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const base = (API_BASE || "").replace(/\/+$/, "");
  const unreadCount = items.filter((n) => !n?.isRead).length;

  // click outside / esc to close
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

  // fetch on open
  async function fetchList({ spinner = true } = {}) {
    if (!open) return;
    spinner ? setLoading(true) : setRefreshing(true);
    try {
      const res = await fetch(`${base}/api/company/notifications?limit=10&page=1`, {
        headers: typeof getAuthHeaders === "function" ? getAuthHeaders() : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load notifications");
      setItems(Array.isArray(data) ? data : data.notifications || []);
    } catch (e) {
      // keep quiet in popover
      console.warn("notif load failed:", e.message);
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
      const r = await fetch(`${base}/api/company/notifications/${id}/read`, {
        method: "PATCH",
        headers: typeof getAuthHeaders === "function" ? getAuthHeaders() : {},
      });
      if (!r.ok) throw new Error();
    } catch {
      // rollback on error
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: false } : n)));
    }
  }
  async function markAllRead() {
    try {
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await fetch(`${base}/api/company/notifications/read-all`, {
        method: "PATCH",
        headers: typeof getAuthHeaders === "function" ? getAuthHeaders() : {},
      });
    } catch {
      fetchList({ spinner: false });
    }
  }

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 w-[380px] max-h-[70vh] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-[60]"
    >
      {/* header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
        <div className="text-sm font-semibold">Notifications</div>
        <button
          onClick={markAllRead}
          className="text-xs text-blue-700 hover:underline"
        >
          Mark all as read
        </button>
      </div>

      {/* content */}
      <div className="relative">
        {loading ? (
          <div className="p-4 grid gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse p-3 rounded-lg border bg-white">
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-sm text-gray-500 text-center">No notifications yet</div>
        ) : (
          <ul className="max-h-[60vh] overflow-y-auto divide-y">
            {items.map((n) => {
              const isUnread = !n?.isRead;
              const jobTitle = n?.data?.jobTitle || "—";
              const applicantName =
                n?.data?.applicantName ||
                (typeof n?.title === "string" &&
                  (n.title.match(/New applicant\s+—\s+(.*?)\s+for\s+/i)?.[1] || null)) ||
                "Applicant";
              const applicantEmail = n?.data?.applicantEmail || null;

              const statusIntent =
                n.status === "Applied"
                  ? "info"
                  : n.status === "Accepted"
                  ? "success"
                  : n.status === "Rejected"
                  ? "warn"
                  : "default";

              return (
                <li
                  key={n._id}
                  className={`px-3 py-3 ${isUnread ? "bg-amber-50" : "bg-white"} hover:bg-gray-50 transition`}
                >
                  <div className="flex gap-3">
                    {/* mini avatar / initials */}
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-medium grid place-items-center shrink-0">
                      {getInitials(applicantName || jobTitle)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {n?.title || `New applicant — ${applicantName} for ${jobTitle}`}
                        </div>
                        {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                        <Chip intent={statusIntent}>{n.status || "—"}</Chip>
                        {n.type && <Chip>{n.type}</Chip>}
                      </div>

                      <div className="text-sm text-gray-700 mt-0.5">
                        {n?.body || `Heads up, ${applicantName} applied for ${jobTitle}.`}
                      </div>

                      <div className="mt-1 text-[11px] text-gray-500 flex gap-3 flex-wrap">
                        <span>
                          Job: <span className="font-medium text-gray-700">{jobTitle}</span>
                        </span>
                        {applicantEmail && <span>{applicantEmail}</span>}
                        <span>{timeAgo(n.createdAt)}</span>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        {isUnread && (
                          <button
                            onClick={() => markRead(n._id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50 text-xs"
                          >
                            <CheckCircle2 size={14} />
                            Read
                          </button>
                        )}
                        {n?.data?.jobId && (
                          <a
                            href={`/company/applications?job=${n.data.jobId}`}
                            className="text-xs text-blue-700 hover:underline"
                          >
                            View applicants →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {refreshing && (
          <div className="absolute top-2 right-2 text-gray-500">
            <Loader2 size={16} className="animate-spin" />
          </div>
        )}
      </div>

      {/* footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50">
        <div className="text-xs text-gray-500">
          Unread: <span className="font-medium">{unreadCount}</span>
        </div>
        <a
          href="/company/notifications"
          className="text-xs text-blue-700 hover:underline"
          onClick={onClose}
        >
          View all notifications →
        </a>
      </div>
    </div>
  );
}

/* -------------- HeaderBar --------------- */
export default function HeaderBar({
  companyName = "Company",
  person = { firstName: "", lastName: "", role: "" },
  onToggleSidebar,
  avatarSrc,
  companyId,
  API_BASE,
  getAuthHeaders,
  companyProfileUrl,
}) {
  const [fetchedAvatar, setFetchedAvatar] = useState("");
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [openPopover, setOpenPopover] = useState(false);
  const [unreadBadge, setUnreadBadge] = useState(0);

  const base = (API_BASE || "").replace(/\/+$/, "");
  const fullName = `${person.firstName || ""} ${person.lastName || ""}`.trim();
  const displayCompany = companyName || "Company";

  const avatarUrl = useMemo(() => (avatarSrc ? avatarSrc : fetchedAvatar || ""), [avatarSrc, fetchedAvatar]);

  // fetch avatar (same as before)
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (avatarSrc) return;
      if (!companyId && !companyProfileUrl) return;
      setLoadingAvatar(true);
      try {
        const url = companyProfileUrl || `${base}/api/companies/${companyId}`;
        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            ...(typeof getAuthHeaders === "function" ? getAuthHeaders() : {}),
          },
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const data = await res.json();
        const rawImage =
          data?.profileImageUrl ||
          data?.profileImage ||
          data?.profilePhoto ||
          data?.company?.profileImageUrl ||
          data?.company?.profileImage ||
          data?.company?.profilePhoto ||
          "";
        const urlToUse = /^https?:\/\//i.test(rawImage) ? rawImage : toImageUrl(rawImage, base);
        if (!ignore) setFetchedAvatar(urlToUse || "");
      } catch {
        if (!ignore) setFetchedAvatar("");
      } finally {
        if (!ignore) setLoadingAvatar(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [avatarSrc, companyId, base, getAuthHeaders, companyProfileUrl]);

  // badge: quick poll
  async function refreshBadge() {
    try {
      const r = await fetch(`${base}/api/company/notifications?limit=20&page=1`, {
        headers: typeof getAuthHeaders === "function" ? getAuthHeaders() : {},
      });
      const j = await r.json();
      if (!r.ok) throw new Error();
      const list = Array.isArray(j) ? j : j.notifications || [];
      setUnreadBadge(list.filter((n) => !n?.isRead).length);
    } catch {
      // keep last
    }
  }
  useEffect(() => {
    refreshBadge();
    const id = setInterval(refreshBadge, 30_000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line

  return (
    <header className="relative h-16 bg-[#173B8A] text-white flex items-center justify-between px-4 md:px-6 ml-[2px]">
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
        <div className="text-xl font-bold leading-none truncate max-w-[40vw]">
          {displayCompany}
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Bell + badge + popover */}
        <div className="relative">
          <button
            className="relative hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/40 rounded p-1"
            title="Notifications"
            type="button"
            onClick={() => setOpenPopover((v) => !v)}  // or your existing handler
            aria-label={`Notifications${unreadBadge > 0 ? ": unread" : ""}`}
          >
            <Bell className="w-5 h-5" />

            {/* 🔴 tiny red dot when there are unread */}
            {unreadBadge > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#173B8A] animate-pulse"
                aria-hidden="true"
              />
            )}
          </button>

          {/* keep your NotificationPopover here if you have it */}
          <NotificationPopover
            open={openPopover}
            onClose={() => {
              setOpenPopover(false);
              setTimeout(refreshBadge, 400); // ensure dot hides after marking read
            }}
            API_BASE={base}
            getAuthHeaders={getAuthHeaders}
          />
        </div>

        {/* Avatar + name/role */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white/80 text-[#173B8A] font-semibold grid place-items-center shrink-0 overflow-hidden">
            {avatarUrl && !loadingAvatar ? (
              <img
                src={avatarUrl}
                alt={`${displayCompany} profile`}
                className="w-full h-full object-cover"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : (
              getInitials(displayCompany)
            )}
          </div>
          <div className="leading-tight text-left min-w-0">
            <div className="font-medium truncate">{fullName || "User"}</div>
            <div className="text-xs text-white/80">{person.role || "Member"}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
