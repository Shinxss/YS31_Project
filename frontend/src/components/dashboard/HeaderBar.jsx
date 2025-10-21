
import React, { useEffect, useMemo, useState } from "react";
import { Bell, PanelLeft } from "lucide-react";

/** Build initials from a name (e.g., "QueueTeeth" -> "Q") */
function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "U";
  const first = parts[0][0]?.toUpperCase() || "";
  const second = parts[1]?.[0]?.toUpperCase() || "";
  return (first + second).trim() || first || "U";
}

/** Heuristics to turn values from DB into a fetchable URL */
function toImageUrl(raw, API_BASE) {
  if (!raw) return "";
  const v = String(raw).trim();


  if (/^https?:\/\//i.test(v)) return v;

 
  const base = (API_BASE || "").replace(/\/+$/, "");
  const candidates = [
    `${base}/uploads/company/${encodeURIComponent(v)}`,
    `${base}/uploads/${encodeURIComponent(v)}`,
    `${base}/${encodeURIComponent(v)}`,
  ];
  return candidates[0]; // prefer the first; you can swap if needed
}

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
  const fullName = `${person.firstName || ""} ${person.lastName || ""}`.trim();

  const displayCompany = companyName || "Company";

  // Decide the final avatar URL to render
  const avatarUrl = useMemo(() => {
    if (avatarSrc) return avatarSrc;
    return fetchedAvatar || "";
  }, [avatarSrc, fetchedAvatar]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (avatarSrc) return; // explicit prop provided; no fetch needed
      if (!companyId && !companyProfileUrl) return; // nothing to fetch with

      setLoadingAvatar(true);
      try {
        const url =
          companyProfileUrl ||
          `${(API_BASE || "").replace(/\/+$/, "")}/api/companies/${companyId}`;

        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            ...(typeof getAuthHeaders === "function" ? getAuthHeaders() : {}),
          },
          credentials: "include",
        });

        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

        const data = await res.json();

        // Accept any of these fields from your backend:
        const rawImage =
          data?.profileImageUrl ||
          data?.profileImage ||
          data?.profilePhoto ||
          data?.company?.profileImageUrl ||
          data?.company?.profileImage ||
          data?.company?.profilePhoto ||
          "";

        const urlToUse = /^https?:\/\//i.test(rawImage)
          ? rawImage
          : toImageUrl(rawImage, API_BASE);

        if (!ignore) setFetchedAvatar(urlToUse || "");
      } catch (err) {
        // Silent fail: we’ll just show initials
        if (!ignore) setFetchedAvatar("");
      } finally {
        if (!ignore) setLoadingAvatar(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [avatarSrc, companyId, API_BASE, getAuthHeaders, companyProfileUrl]);

  return (
    <header className="h-16 bg-[#173B8A] text-white flex items-center justify-between px-4 md:px-6 ml-[2px]">
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
        <button className="relative hover:opacity-90" title="Notifications" type="button">
          <Bell className="w-5 h-5" />
        </button>

        {/* Avatar + name/role */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white/80 text-[#173B8A] font-semibold grid place-items-center shrink-0 overflow-hidden">
            {avatarUrl && !loadingAvatar ? (
              <img
                src={avatarUrl}
                alt={`${displayCompany} profile`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // If image fails to load, fall back to initials
                  e.currentTarget.style.display = "none";
                }}
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
