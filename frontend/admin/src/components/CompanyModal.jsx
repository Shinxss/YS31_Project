// src/components/CompanyModal.jsx
import React from "react";
import { X } from "lucide-react";

/**
 * CompanyModal
 *
 * props:
 *  - open: boolean
 *  - onClose: () => void
 *  - company: object { name, email, location, appliedAt, documents: [{ id, name, url }], ... }
 *  - onVerify: (companyId) => void
 *  - onReject: (companyId) => void
 */
export default function CompanyModal({ open, onClose, company, onVerify, onReject }) {
  if (!open) return null;

  const handleDownload = (doc) => {
    // In a real app you'd navigate to doc.url or fetch it.
    // For now we simulate by opening the URL in a new tab (if provided)
    if (doc?.url) window.open(doc.url, "_blank");
    else alert(`Download ${doc.name} (placeholder)`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* dark overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* modal box */}
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-2xl">
        <div className="p-6">
          {/* header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">{company.name}</h2>
              <p className="text-sm text-gray-500 mt-1">Company verification details</p>
            </div>

            <button
              aria-label="Close"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          {/* content */}
          <div className="mt-6 grid grid-cols-1 gap-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm text-gray-600">Company Name</h3>
                <div className="mt-1 font-semibold text-gray-800">{company.name}</div>
              </div>

              <div>
                <h3 className="text-sm text-gray-600">Contact Email</h3>
                <div className="mt-1 font-semibold text-gray-800">{company.email}</div>
              </div>

              <div>
                <h3 className="text-sm text-gray-600">Location</h3>
                <div className="mt-1 font-semibold text-gray-800">{company.location}</div>
              </div>

              <div>
                <h3 className="text-sm text-gray-600">Applied</h3>
                <div className="mt-1 text-gray-700">{company.appliedAt}</div>
              </div>
            </div>

            {/* Documents */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Legal Documents</h3>
              <div className="space-y-3">
                {company.documents?.length ? (
                  company.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between border rounded-lg px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
                        </svg>
                        <div>
                          <div className="text-sm font-medium text-gray-800">{doc.name}</div>
                          <div className="text-xs text-gray-500">{doc.type || "Document"}</div>
                        </div>
                      </div>

                      <div>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-2 rounded-md hover:bg-gray-100"
                          title={`Download ${doc.name}`}
                        >
                          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v12m0 0l4-4m-4 4l-4-4M21 21H3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No documents uploaded.</div>
                )}
              </div>
            </div>

            {/* actions */}
            <div className="flex items-center justify-between gap-4 pt-4">
              <div className="flex-1">
                <button
                  onClick={() => onVerify(company.id)}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  Verify & Approve Company
                </button>
              </div>

              <div className="flex-1">
                <button
                  onClick={() => onReject(company.id)}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  Reject Application
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
