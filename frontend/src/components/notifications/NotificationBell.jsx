// src/components/notifications/NotificationBell.jsx
import { useEffect, useRef, useState } from "react";

const RAW_API_BASE =
  (import.meta.env?.VITE_API_BASE ||
    (typeof window !== "undefined" && /:5173|:5174/.test(window.location.origin)
      ? "http://localhost:5000"
      : "")).trim();
const api = (p) => (RAW_API_BASE ? `${RAW_API_BASE}${p}` : p);

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("ic_company_token") || localStorage.getItem("ic_token")
      : null;
  const ref = useRef(null);

  const fetchFeed = async () => {
    const r = await fetch(api("/api/company/notifications"), {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    });
    const data = await r.json();
    if (r.ok) {
      setItems(Array.isArray(data.items) ? data.items : []);
      setUnread(data.unread || 0);
    }
  };

  useEffect(() => {
    fetchFeed();
    const id = setInterval(fetchFeed, 30000); // light polling
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (open && ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const markAllRead = async () => {
    await fetch(api("/api/company/notifications/mark-all-read"), {
      method: "POST",
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    fetchFeed();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        className="relative p-2 rounded-full hover:bg-gray-100"
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
      >
        <span className="material-icons-outlined">notifications</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[420px] max-h-[70vh] overflow-auto rounded-xl border bg-white shadow-xl">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="text-lg font-semibold">Notifications</div>
            <button
              onClick={markAllRead}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Mark all as read
            </button>
          </div>

          <div className="divide-y">
            {items.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No notifications.</div>
            ) : (
              items.map((n) => (
                <NotifRow key={n._id} n={n} onChanged={fetchFeed} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotifRow({ n, onChanged }) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("ic_company_token") || localStorage.getItem("ic_token")
      : null;

  const highlight = n.highlight && !n.isRead;

  const timeAgo = (iso) => {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  };

  const markRead = async () => {
    await fetch(api(`/api/company/notifications/${n._id}/read`), {
      method: "POST",
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    onChanged?.();
  };

  const openProfile = () => {
    if (n.student?._id) window.location.href = `/company/students/${n.student._id}`;
  };

  const openApplication = async () => {
    await markRead(); // mark read when opening
    // Go to Applications, optionally with a query to auto-open the modal
    const dest = n.application?._id
      ? `/company/applications?open=${n.application._id}`
      : `/company/applications`;
    window.location.href = dest;
  };

  return (
    <div className={`p-4 ${highlight ? "bg-orange-50" : "bg-white"}`}>
      <div className="flex gap-3">
        {n.student?.profilePicture ? (
          <img
            src={n.student.profilePicture}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-gray-100 border flex items-center justify-center text-xs font-semibold text-gray-700">
            {(n.student?.fullName || "?")
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="text-sm text-gray-900">
            <span className="font-medium">{n.student?.fullName || "A student"}</span>{" "}
            applied for <span className="font-medium">{n.job?.title || "your job"}</span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            applied {timeAgo(n.createdAt)}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={openProfile}
              className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
            >
              View Profile
            </button>
            <button
              onClick={openApplication}
              className="px-3 py-1.5 rounded-md bg-black text-white text-sm hover:bg-gray-800"
            >
              Review Application
            </button>
          </div>

          {!n.isRead && (
            <button
              onClick={markRead}
              className="mt-2 text-xs text-gray-500 hover:text-gray-900"
            >
              Mark as read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
