// src/pages/admin/DataExportPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, FileDown } from "lucide-react";

/* -------------------------------------------------------
   API base (robust; fixes ":5000" etc.)
------------------------------------------------------- */
function resolveApiBase() {
  let raw = (import.meta.env?.VITE_API_BASE || "").trim();
  raw = raw.replace(/\/+$/, "");
  if (/^:/.test(raw)) raw = `${window.location.protocol}//localhost${raw}`;
  else if (/^localhost(?::\d+)?$/.test(raw)) raw = `${window.location.protocol}//${raw}`;
  if (!raw && typeof window !== "undefined" && /:5173|:5174/.test(window.location.origin)) {
    raw = "http://localhost:5000";
  }
  return raw;
}
const RAW_API_BASE = resolveApiBase();
const api = (p) => (RAW_API_BASE ? `${RAW_API_BASE}${p}` : p);

/* -------------------------------------------------------
   Endpoints
   POST /api/admin/export?format=csv|xlsx
   body: { collections: ["students","companies","jobs","applications"] }
------------------------------------------------------- */
const API = {
  exportData: (format) => api(`/api/admin/export?format=${encodeURIComponent(format)}`),
};

const COLLECTIONS = [
  { key: "students", label: "Students" },
  { key: "companies", label: "Companies" },
  { key: "jobs", label: "Job Listings" },
  { key: "applications", label: "Applications" },
];

const cls = (...xs) => xs.filter(Boolean).join(" ");

export default function DataExportPage() {
  const [selected, setSelected] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [format, setFormat] = useState("csv"); // 'csv' | 'xlsx'
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const canExport = selected.length > 0 && !downloading;

  const filename = useMemo(() => {
    const dt = new Date();
    const ts = [
      dt.getFullYear(),
      String(dt.getMonth() + 1).padStart(2, "0"),
      String(dt.getDate()).padStart(2, "0"),
      "_",
      String(dt.getHours()).padStart(2, "0"),
      String(dt.getMinutes()).padStart(2, "0"),
    ].join("");
    const base =
      selected.length === 1 ? `internconnect_${selected[0]}_${ts}` : `internconnect_export_${ts}`;
    return `${base}.${format}`;
  }, [format, selected]);

  const toggleAll = () => {
    const next = !selectAll;
    setSelectAll(next);
    setSelected(next ? COLLECTIONS.map((c) => c.key) : []);
  };

  const toggleOne = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  };

  const syncSelectAll = (list) => {
    setSelectAll(list.length === COLLECTIONS.length);
  };

  const handleExport = async () => {
    try {
      setError("");
      setOk("");
      setDownloading(true);

      const res = await fetch(API.exportData(format), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ collections: selected }),
      });

      if (!res.ok) {
        const msg = (await res.json().catch(() => ({}))).message || "Export failed";
        throw new Error(msg);
      }

      const blob = await res.blob();
      const contentType = res.headers.get("content-type") || "";

      let finalName = filename;
      if (contentType.includes("application/zip")) {
        finalName = filename.replace(/\.(csv|xlsx)$/i, ".zip");
      } else if (
        contentType.includes(
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
      ) {
        finalName = filename.replace(/\.csv$/i, ".xlsx");
      } else if (contentType.includes("text/csv")) {
        finalName = filename.replace(/\.xlsx$/i, ".csv");
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = finalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setOk("Export completed. Your download should start automatically.");
    } catch (e) {
      setError(e.message || "Export failed");
    } finally {
      setDownloading(false);
    }
  };

  // keep Select All in sync when user toggles individuals
  useEffect(() => {
    syncSelectAll(selected);
  }, [selected]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900">Data Export</h1>
      <p className="text-sm text-gray-500">Export platform data in various formats</p>

      <div className="mt-4 bg-white border border-gray-200 rounded-xl">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-medium text-gray-900">Export Data</h2>
          <p className="text-sm text-gray-500">
            Select the data collections and format to export
          </p>
        </div>

        <div className="p-4 space-y-6">
          {/* Collections */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Data Collections</div>

            <label className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 cursor-pointer select-none">
              <input type="checkbox" className="h-4 w-4" checked={selectAll} onChange={toggleAll} />
              <span className="font-medium text-blue-900">Select All</span>
            </label>

            <div className="mt-3 space-y-2">
              {COLLECTIONS.map((c) => (
                <label
                  key={c.key}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selected.includes(c.key)}
                    onChange={() => toggleOne(c.key)}
                  />
                  <span className="text-gray-800">{c.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Export Format</div>
            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === "csv"}
                  onChange={() => setFormat("csv")}
                />
                <span>CSV</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="xlsx"
                  checked={format === "xlsx"}
                  onChange={() => setFormat("xlsx")}
                />
                <span>XLSX</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div>{error}</div>
            </div>
          )}
          {ok && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3 flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 mt-0.5" />
              <div>{ok}</div>
            </div>
          )}

          <button
            disabled={!canExport}
            onClick={handleExport}
            className={cls(
              "w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium",
              canExport
                ? "bg-indigo-500 text-white hover:bg-indigo-600"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            )}
          >
            {downloading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Preparing…
              </>
            ) : (
              <>
                <FileDown className="h-5 w-5" /> Export Data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
