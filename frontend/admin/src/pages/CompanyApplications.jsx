import React, { useState } from "react";
import { FileText, Download } from "lucide-react";

export default function CompanyApplications() {
  const [selectedCompany, setSelectedCompany] = useState(null);

  const companies = [
    {
      name: "TechStart Solutions",
      email: "contact@techstart.com",
      location: "San Francisco, CA",
      date: "2025-10-18",
      documents: [
        { name: "Business License" },
        { name: "Tax ID" },
      ],
    },
    {
      name: "Innovation Hub",
      email: "hr@innovhub.com",
      location: "New York, NY",
      date: "2025-10-19",
      documents: [
        { name: "Business License" },
        { name: "Tax ID" },
      ],
    },
    {
      name: "Future Ventures",
      email: "admin@futureventures.com",
      location: "Austin, TX",
      date: "2025-10-20",
      documents: [
        { name: "Business License" },
        { name: "Tax ID" },
      ],
    },
  ];

  return (
    <div className="ml-72 pt-28 p-8">
      {/* Page Title */}
      <h1 className="text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">
        Company Applications
      </h1>
      <p className="text-xl text-gray-600 mb-10">
        Review and verify pending company applications
      </p>

      {/* Company Cards */}
      <div className="bg-white shadow-sm rounded-2xl border border-gray-200 p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-3">
          Pending Verification Queue
        </h2>
        <p className="text-lg text-gray-500 mb-8">
          Companies awaiting approval
        </p>

        <div className="space-y-5">
          {companies.map((company, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-6 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all duration-200"
            >
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  {company.name}
                </h3>
                <p className="text-lg text-gray-700">{company.email}</p>
                <p className="text-lg text-gray-700">{company.location}</p>
                <p className="text-base text-gray-500">
                  Applied: {company.date}
                </p>
              </div>
              <button
                onClick={() => setSelectedCompany(company)}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white text-lg font-medium rounded-lg shadow transition"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 🔹 Background overlay FIXED */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setSelectedCompany(null)}
          ></div>

          {/* Modal box */}
          <div className="relative z-50 bg-white rounded-2xl p-10 w-full max-w-3xl shadow-2xl border border-gray-200">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <h3 className="text-3xl font-extrabold text-gray-900">
                {selectedCompany.name}
              </h3>
              <button
                onClick={() => setSelectedCompany(null)}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-lg text-gray-600 mb-6">
              Company verification details
            </p>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="font-bold text-gray-800 text-lg mb-1">
                  Company Name
                </h4>
                <p className="text-gray-700 text-lg">{selectedCompany.name}</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg mb-1">
                  Contact Email
                </h4>
                <p className="text-gray-700 text-lg">{selectedCompany.email}</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg mb-1">
                  Location
                </h4>
                <p className="text-gray-700 text-lg">
                  {selectedCompany.location}
                </p>
              </div>
            </div>

            {/* Legal Documents */}
            <div className="mb-8">
              <h4 className="font-bold text-gray-800 text-lg mb-4">
                Legal Documents
              </h4>
              {selectedCompany.documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-lg bg-gray-50 mb-3"
                >
                  <div className="flex items-center gap-3 text-gray-800 text-lg">
                    <FileText className="w-6 h-6" />
                    {doc.name}
                  </div>
                  <Download className="w-6 h-6 text-gray-600 cursor-pointer hover:text-gray-800" />
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-5">
              <button className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold text-lg rounded-lg shadow-md transition">
                Verify & Approve Company
              </button>
              <button
                onClick={() => setSelectedCompany(null)}
                className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-lg rounded-lg shadow-md transition"
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
