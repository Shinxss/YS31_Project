import React, { useState, useEffect } from "react";

const SAMPLE_DATA = {
  students: [
    { id: 1, firstName: "John", lastName: "Doe", email: "john@mit.edu", school: "MIT" },
    { id: 2, firstName: "Jane", lastName: "Smith", email: "jane@stanford.edu", school: "Stanford" },
  ],
  companies: [
    { id: "c1", name: "TechCorp", email: "info@techcorp.com", location: "San Francisco, CA" },
    { id: "c2", name: "InnoSoft", email: "contact@innosoft.com", location: "Seattle, WA" },
  ],
  jobListings: [
    { id: "j1", title: "Senior Developer", company: "TechCorp", posted: "2025-10-20" },
    { id: "j2", title: "Product Manager", company: "StartUp Inc", posted: "2025-10-18" },
  ],
  applications: [
    { id: "a1", applicant: "Alice", type: "Intern", date: "2025-10-21" },
    { id: "a2", applicant: "Bob", type: "Full-time", date: "2025-10-19" },
  ],
};

function objectArrayToCSV(rows = []) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(","), ...rows.map(r => keys.map(k => {
    const v = r[k] ?? "";
    return v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(","))];
  return lines.join("\n");
}

export default function DataExport() {
  const collections = [
    { id: "students", label: "Students" },
    { id: "companies", label: "Companies" },
    { id: "jobListings", label: "Job Listings" },
    { id: "applications", label: "Applications" },
  ];

  const [selected, setSelected] = useState(() => new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [format, setFormat] = useState("csv");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setSelectAll(selected.size === collections.length);
  }, [selected]);

  const toggleCollection = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelected(new Set());
      setSelectAll(false);
    } else {
      setSelected(new Set(collections.map(c => c.id)));
      setSelectAll(true);
    }
  };

  const handleExport = async () => {
    if (selected.size === 0) {
      alert("Please select at least one data collection to export.");
      return;
    }

    setExporting(true);

    try {
      for (const id of Array.from(selected)) {
        const label = collections.find(c => c.id === id)?.label || id;
        const rows = SAMPLE_DATA[id] || [];
        const csv = objectArrayToCSV(rows);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${label.replace(/\s+/g, "_").toLowerCase()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed — check console for details.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="ml-72 pt-28 p-10">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">
        Data Export
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Export platform data in various formats
      </p>

      <div className="bg-white rounded-3xl shadow-md border border-gray-200 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Export Data</h3>
        <p className="text-lg text-gray-500 mb-6">
          Select the data collections and format to export
        </p>

        {/* Data Collections */}
        <div className="space-y-8">
          <div>
            <div className="text-lg font-semibold text-gray-800 mb-4">
              Data Collections
            </div>

            {/* Select All */}
            <div
              className="flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-200 px-5 py-4 cursor-pointer hover:bg-blue-100 transition"
              onClick={handleSelectAll}
            >
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                className="w-5 h-5 accent-blue-500"
              />
              <span className="text-lg font-semibold text-blue-800">
                Select All
              </span>
            </div>

            {/* Individual checkboxes */}
            <div className="mt-5 ml-3 space-y-4">
              {collections.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-3 text-lg text-gray-900 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggleCollection(c.id)}
                    className="w-5 h-5 accent-blue-500"
                  />
                  <span className="font-medium">{c.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Format Section */}
          <div>
            <div className="text-lg font-semibold text-gray-800 mb-4">
              Export Format
            </div>
            <div className="flex items-center gap-8 text-lg text-gray-900">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === "csv"}
                  onChange={() => setFormat("csv")}
                  className="w-5 h-5 accent-blue-500"
                />
                <span className="font-medium">CSV</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="format"
                  value="xlsx"
                  checked={format === "xlsx"}
                  onChange={() => setFormat("xlsx")}
                  className="w-5 h-5 accent-blue-500"
                />
                <span className="font-medium">XLSX</span>
              </label>
            </div>
          </div>

          {/* Export Button */}
          <div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full py-4 font-bold text-lg transition disabled:opacity-60"
            >
              {exporting ? "Exporting…" : "Export Data"}
            </button>
            <p className="text-base text-gray-500 mt-3">
              Tip: CSV download is handled client-side for demo. For real XLSX export, use a backend or the “xlsx” npm library.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-base text-gray-600">
        <strong>Notes:</strong> For large exports or XLSX:
        <ul className="list-disc list-inside ml-5 mt-2 space-y-1">
          <li>Install <code>xlsx</code> and generate .xlsx files client-side.</li>
          <li>Or use a backend endpoint (e.g. <code>/api/export</code>) to generate the file on the server.</li>
        </ul>
      </div>
    </div>
  );
}
