import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

export default function ProfileAddModal({
  type,
  onClose,
  onSave,
  initialData = null,
  loading = false,
}) {
  const [form, setForm] = useState(initialData || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const inputClass =
    "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  const labelClass = "text-sm font-medium text-gray-700";

  const renderFields = () => {
    switch (type) {
      case "experience":
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Job Title*</label>
              <input
                name="jobTitle"
                value={form.jobTitle || ""}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Job Type*</label>
                <select
                  name="jobType"
                  value={form.jobType || ""}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select</option>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Intern</option>
                  <option>Contract</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Work Type*</label>
                <select
                  name="workType"
                  value={form.workType || ""}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select</option>
                  <option>On-site</option>
                  <option>Remote</option>
                  <option>Hybrid</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Company Name*</label>
              <input
                name="companyName"
                value={form.companyName || ""}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Location</label>
              <input
                name="location"
                value={form.location || ""}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Start Date*</label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate || ""}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate || ""}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        );

      case "education":
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>School*</label>
              <input
                name="school"
                value={form.school || ""}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Degree / Course*</label>
              <input
                name="degree"
                value={form.degree || ""}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Start Date*</label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate || ""}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>End Date (Expected)</label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate || ""}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        );

      case "certification":
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Title of Certificate*</label>
              <input
                name="title"
                value={form.title || ""}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Company / Issuer*</label>
              <input
                name="companyName"
                value={form.companyName || ""}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Date Received*</label>
              <input
                type="date"
                name="dateReceived"
                value={form.dateReceived || ""}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 overflow-y-auto py-10">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl w-full max-w-2xl shadow-lg border border-gray-200 relative"
      >
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 flex justify-between items-center px-6 py-3 rounded-t-xl">
          <h2 className="text-lg font-semibold text-gray-800 capitalize">
            {initialData ? `Edit ${type}` : `Add ${type}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {(loading || saving) && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          )}
          {renderFields()}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border text-gray-700 text-sm hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            {initialData ? "Save Changes" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
