import React from "react";
import { confirmAction } from "@/utils/confirm";
import { GraduationCap, Pencil, Trash2 } from "lucide-react";

export default function EducationCard({ education, onEdit, onDelete }) {
  if (!education) return null;

  const { school, degree, startDate, endDate } = education;

  const formattedDates = `${new Date(startDate).getFullYear()} - ${
    endDate ? new Date(endDate).getFullYear() : "Present"
  }`;

  return (
    <div className="flex items-center justify-between bg-blue-50 rounded-lg p-4 border border-blue-100">
      <div className="flex items-center gap-3">
        <div className="bg-white p-3 rounded-md border border-gray-300">
          <GraduationCap className="w-6 h-6 text-gray-800" />
        </div>
        <div className="leading-tight">
          <p className="font-medium text-gray-900">{degree || "Degree / Course"}</p>
          <p className="text-sm text-gray-700">{school || "School"}</p>
          <p className="text-sm text-gray-600">{formattedDates}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onEdit(education)}
          className="text-blue-600 hover:text-blue-800 transition"
          title="Edit"
        >
          <Pencil className="w-5 h-5" />
        </button>
        <button
          onClick={async () => {
            const ok = await confirmAction({ title: 'Delete education?', text: 'This action cannot be undone.', confirmText: 'Delete' });
            if (ok) onDelete(education._id)
          }}
          className="text-orange-500 hover:text-orange-700 transition"
          title="Delete"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
