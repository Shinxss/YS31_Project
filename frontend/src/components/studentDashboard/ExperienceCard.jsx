import React from "react";
import { Briefcase, Pencil, Trash2 } from "lucide-react";

export default function ExperienceCard({ experience, onEdit, onDelete }) {
  if (!experience) return null;

  const { jobTitle, companyName, startDate, endDate } = experience;

  const formattedDates = `${new Date(startDate).getFullYear()} - ${
    endDate ? new Date(endDate).getFullYear() : "Present"
  }`;

  return (
    <div className="flex items-center justify-between bg-blue-50 rounded-lg p-4 border border-blue-100">
      {/* Left: icon + info */}
      <div className="flex items-center gap-3">
        <div className="bg-white p-3 rounded-md border border-gray-300">
          <Briefcase className="w-6 h-6 text-gray-800" />
        </div>
        <div className="leading-tight">
          <p className="font-medium text-gray-900">{jobTitle || "Job Title"}</p>
          <p className="text-sm text-gray-700">{companyName || "Organization"}</p>
          <p className="text-sm text-gray-600">{formattedDates}</p>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onEdit(experience)}
          className="text-blue-600 hover:text-blue-800 transition"
          title="Edit"
        >
          <Pencil className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDelete(experience._id)}
          className="text-orange-500 hover:text-orange-700 transition"
          title="Delete"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
