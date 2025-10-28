import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bell, PanelLeft, Loader2, Trash2 } from "lucide-react";

/* ---------------- constants ---------------- */
const PERM_TYPE = "application";
const PERM_STATUS = "Applied";

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

/* ---------------- Notification Popover ---------------- */
function NotificationPopover({ open, onClose, API_BASE, getAuthHeaders }) {
  const panelRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const base = (API_BASE || "").replace(/\/+$/, "");

  // close on outside / esc
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

  // fetch list
  async function fetchList({ spinner = true } = {}) {
    if (!open) return;
    spinner ? setLoading(true) : setRefreshing(true);
    try {
      const url = `${base}/api/company/notifications?limit=10&page=1&type=${encodeURIComponent(
        PERM_TYPE
      )}&status=${encodeURIComponent(PERM_STATUS)}`;

      const res = await fetch(url, {
        headers: typeof getAuthHeaders === "function" ? getAuthHeaders() : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load notifications");

      const list = Array.isArray(data) ? data : data.notifications || [];
      // defensive filter
      const appliedOnly = list.filter(
        (n) =>
          String(n?.type || "").toLowerCase() === PERM_TYPE &&
          (n?.status === PERM_STATUS || n?.data?.status === PERM_STATUS)
      );

      setItems(appliedOnly);
    } catch (e) {
      console.warn("notif load failed:", e.message);
      setItems([]);
    } finally {
      spinner ? setLoading(false) : setRefreshing(false);
    }
  }

  useEffect(() => {
    if (open) fetchList({ spinner: true });
  }, [open]); // eslint-disable-line

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => fetchList({ spinner: false }), 30_000);
    return () => clearInterval(id);
  }, [open]); // eslint-disable-line

  // mark single as read (awaits server)
  async function markRead(id) {
    try {
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      const token = localStorage.getItem("ic_token");
      const res = await fetch(`${base}/api/company/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(typeof getAuthHeaders === "function" ? getAuthHeaders() : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isRead: true }),
      });
      if (!res.ok) throw new Error(`markRead failed ${res.status}`);
      return true;
    } catch (err) {
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: false } : n)));
      console.warn("markRead error:", err?.message || err);
      return false;
    }
  }

  // optional beacon fallback for unload cases
  function beaconMarkRead(id) {
    try {
      if (!("sendBeacon" in navigator)) return false;
      const token = localStorage.getItem("ic_token") || "";
      const blob = new Blob([JSON.stringify({ id, isRead: true, token })], {
        type: "application/json",
      });
      return navigator.sendBeacon(`${base}/api/company/notifications/read-beacon`, blob);
    } catch {
      return false;
    }
  }

  // primary action
  async function goReview(n) {
    const id = n?._id;
    if (id) {
      const ok = await markRead(id);
      if (!ok) beaconMarkRead(id);
    }
    const job = n?.data?.jobId ? `job=${encodeURIComponent(n.data.jobId)}` : "";
    const app = n?.data?.applicationId ? `review=${encodeURIComponent(n.data.applicationId)}` : "";
    const sep = job && app ? "&" : "";
    const query = job || app ? `?${job}${sep}${app}` : "";
    window.location.assign(`/company/applications${query}`);
  }

  if (!open) return null;

  const unreadCount = items.filter((n) => !n?.isRead).length;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 w-[420px] max-h-[70vh] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-[60]"
    >
      {/* header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-white">
        <div className="text-sm font-semibold">Notifications</div>
        <button
          onClick={() => {
            Promise.all(items.filter(i => !i.isRead).map(i => markRead(i._id)))
              .then(() => fetchList({ spinner: false }));
          }}
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
              const jobTitle = n?.data?.jobTitle || "the job";
              const applicantName =
                n?.data?.applicantName ||
                (typeof n?.title === "string" &&
                  (n.title.match(/New applicant\s+—\s+(.*?)\s+for\s+/i)?.[1] || null)) ||
                "Applicant";

              return (
                <li key={n._id} className="px-3 py-3 bg-white">
                  <div className="flex items-start gap-3">
                    {/* avatar with green dot */}
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-700 font-semibold grid place-items-center overflow-hidden">
                        {getInitials(applicantName)}
                      </div>
                      <span className="absolute bottom-0 left-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-gray-800">
                        <span className="font-semibold">{applicantName}</span>{" "}
                        applied for <span className="font-semibold">{jobTitle}</span>
                      </div>

                      <div className="text-[12px] text-gray-500 mt-0.5">
                        {timeAgo(n.createdAt)} • InternConnect
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => goReview(n)}
                          className="px-3 py-1.5 rounded-md text-white text-xs bg-orange-500 hover:opacity-95"
                          title="Review application"
                        >
                          Review Application
                        </button>

                        {/* red unread indicator (per-item) */}
                        {isUnread && (
                          <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-red-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            New
                          </span>
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
      <div className="flex items-center justify-between px-3 py-2 border-t bg-white">
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
/* ---------------- HeaderBar ---------------- */
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

  // fetch avatar
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

  // badge — count applied-only unread
  async function refreshBadge() {
    try {
      const url = `${base}/api/company/notifications?limit=20&page=1&type=${encodeURIComponent(
        PERM_TYPE
      )}&status=${encodeURIComponent(PERM_STATUS)}`;
      const r = await fetch(url, {
        headers: typeof getAuthHeaders === "function" ? getAuthHeaders() : {},
      });
      const j = await r.json();
      if (!r.ok) throw new Error();
      const list = Array.isArray(j) ? j : j.notifications || [];
      const appliedOnly = list.filter(
        (n) =>
          String(n?.type || "").toLowerCase() === PERM_TYPE &&
          (n?.status === PERM_STATUS || n?.data?.status === PERM_STATUS)
      );
      setUnreadBadge(appliedOnly.filter((n) => !n?.isRead).length);
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
            onClick={() => setOpenPopover((v) => !v)}
            aria-label={`Notifications${unreadBadge > 0 ? ": unread" : ""}`}
          >
            <Bell className="w-5 h-5" />

            {/* RED unread dot on bell */}
            {unreadBadge > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#173B8A] animate-pulse"
                aria-hidden="true"
              />
            )}
          </button>

          <NotificationPopover
            open={openPopover}
            onClose={() => {
              setOpenPopover(false);
              setTimeout(refreshBadge, 400);
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
