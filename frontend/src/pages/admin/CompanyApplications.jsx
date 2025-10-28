// src/pages/admin/CompanyApplications.jsx
import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, FileText, Download } from "lucide-react";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CompanyApplications() {
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/company-applications`)
      .then((res) => res.json())
      .then(setCompanies)
      .catch(() => toast.error("Failed to load company applications"));
  }, []);

  async function handleDecision(id, action) {
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/company-applications/${id}/${action}`,
        { method: "PATCH" }
      );
      if (!res.ok) throw new Error();
      toast.success(`Company ${action === "approve" ? "approved" : "rejected"}`);
      setCompanies((prev) => prev.filter((c) => c._id !== id));
      setSelected(null);
    } catch {
      toast.error("Action failed");
    }
  }

  return (
    <div className="ml-72 pt-28 p-8">
      <h1 className="text-2xl font-semibold mb-2">Company Applications</h1>
      <p className="text-gray-600 mb-6">Review and verify pending company applications</p>

      <div className="grid gap-4">
        {companies.map((c) => (
          <div
            key={c._id}
            className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 flex justify-between items-center hover:shadow-md transition"
          >
            <div>
              <h2 className="font-semibold text-gray-800">{c.companyName}</h2>
              <p className="text-sm text-gray-600">{c.email}</p>
              <p className="text-sm text-gray-500">
                {c.city}, {c.province}
              </p>
            </div>
            <button
              onClick={() => setSelected(c)}
              className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white"
            >
              View Details
            </button>
          </div>
        ))}

        {companies.length === 0 && (
          <p className="text-gray-500 italic">No pending applications found.</p>
        )}
      </div>

      {/* MODAL */}
      {selected && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-2xl w-[550px] p-6 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{selected.companyName}</h2>
                <p className="text-gray-500 text-sm">Company verification details</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-gray-700 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <h3 className="font-medium text-gray-700">Company Information</h3>
              <p><strong>Company Name:</strong> {selected.companyName}</p>
              <p><strong>Contact Email:</strong> {selected.email}</p>
              <p><strong>Location:</strong> {selected.city}, {selected.province}</p>
            </div>

            <div className="mt-4">
              <h3 className="font-medium text-gray-700 mb-2">Legal Documents</h3>
              {selected.documents?.length ? (
                selected.documents.map((doc, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-gray-50 p-2 rounded-lg mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={16} />
                      <span>{doc.name}</span>
                    </div>
                    <a
                      href={`${API_BASE}/${doc.path}`}
                      download
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm italic">No documents uploaded.</p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => handleDecision(selected._id, "approve")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
              >
                <CheckCircle2 size={16} /> Verify & Approve Company
              </button>
              <button
                onClick={() => handleDecision(selected._id, "reject")}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
              >
                <XCircle size={16} /> Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
