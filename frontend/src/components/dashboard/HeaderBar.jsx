// frontend/src/components/dashboard/HeaderBar.jsx
import React, { useEffect, useState } from "react"; // ✅ added useEffect/useState
import { Bell, PanelLeft } from "lucide-react";
import { getCompanyStats } from "@/services/api"; // ✅ added

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0]?.toUpperCase() || "")
    .slice(0, 2)
    .join("");
}

// ✅ helpers to tolerate slightly different response shapes
function pickCompanyName(res) {
  return (
    res?.companyName ||
    res?.company?.companyName ||
    res?.company?.name ||
    res?.data?.companyName ||
    ""
  );
}
function pickUser(res) {
  const u = res?.user || res?.data?.user || {};
  return {
    firstName: u.firstName || "",
    lastName: u.lastName || "",
    role: u.role || "",
  };
}

export default function HeaderBar({
  companyName = "Company",
  person = { firstName: "", lastName: "", role: "" },
  onToggleSidebar,
}) {
  // ✅ local state to hydrate from backend (without breaking props usage)
  const [hdrCompany, setHdrCompany] = useState("");
  const [hdrPerson, setHdrPerson] = useState({ firstName: "", lastName: "", role: "" });

  // ✅ fetch /api/company/me once (if token exists)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token =
          localStorage.getItem("ic_token") ||
          localStorage.getItem("companyToken") ||
          localStorage.getItem("token");
        if (!token) return;

        const res = await getCompanyStats(); // calls /api/company/me
        if (!mounted) return;

        const apiCompanyName = pickCompanyName(res);
        const apiUser = pickUser(res);

        if (apiCompanyName) setHdrCompany(apiCompanyName);
        setHdrPerson((prev) => ({
          firstName: apiUser.firstName || prev.firstName,
          lastName: apiUser.lastName || prev.lastName,
          role: apiUser.role || prev.role,
        }));
      } catch (_) {
        // silent — header will just use props
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ✅ compute display values (fetched overrides props if present)
  const displayCompany = hdrCompany || companyName;
  const displayPerson = {
    firstName: hdrPerson.firstName || person.firstName || "",
    lastName: hdrPerson.lastName || person.lastName || "",
    role: hdrPerson.role || person.role || "Member",
  };

  const fullName = `${displayPerson.firstName || ""} ${displayPerson.lastName || ""}`.trim();

  return (
    // tiny 2px gutter from the sidebar on the left
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
        <div className="text-xl font-bold leading-none">{displayCompany}</div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative hover:opacity-90" title="Notifications" type="button">
          <Bell className="w-5 h-5" />
        </button>

        {/* Avatar + name/role */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded bg-white/80 text-[#173B8A] font-semibold grid place-items-center shrink-0">
            {getInitials(fullName || displayCompany)}
          </div>

          {/* Make name & role left-aligned so role starts exactly under the name */}
          <div className="leading-tight text-left min-w-0">
            <div className="font-medium truncate">{fullName || "User"}</div>
            <div className="text-xs text-white/80">{displayPerson.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
