import React from "react";
import { Award, Pencil, Trash2 } from "lucide-react";

export default function CertificateCard({ certificate, onEdit, onDelete }) {
  if (!certificate) return null;

  const { title, companyName, dateReceived } = certificate;

  const formattedDate = dateReceived
    ? new Date(dateReceived).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Date not set";

  return (
    <div className="flex items-center justify-between bg-blue-50 rounded-lg p-4 border border-blue-100">
      <div className="flex items-center gap-3">
        <div className="bg-white p-3 rounded-md border border-gray-300">
          <Award className="w-6 h-6 text-gray-800" />
        </div>
        <div className="leading-tight">
          <p className="font-medium text-gray-900">{title || "Certificate Title"}</p>
          <p className="text-sm text-gray-700">{companyName || "Issuer"}</p>
          <p className="text-sm text-gray-600">{formattedDate}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onEdit(certificate)}
          className="text-blue-600 hover:text-blue-800 transition"
          title="Edit"
        >
          <Pencil className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDelete(certificate._id)}
          className="text-orange-500 hover:text-orange-700 transition"
          title="Delete"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
