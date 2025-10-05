// frontend/src/components/dashboard/PostJobModal.jsx
import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const CURRENCIES = [
  { code: "PHP", symbol: "₱", label: "Philippine Peso (PHP)" },
  { code: "USD", symbol: "$", label: "US Dollar (USD)" },
  { code: "EUR", symbol: "€", label: "Euro (EUR)" },
  { code: "GBP", symbol: "£", label: "British Pound (GBP)" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen (JPY)" },
];

const EMPTY_FORM = {
  title: "",
  salaryMin: "",
  salaryMax: "",
  salaryCurrency: "PHP",
  startDate: "",
  durationMonths: "",
  location: "",
  workType: "On-site",
  description: "",
  tags: "",
};

export default function PostJobModal({ open, onClose, token, onCreated }) {
  // fixed hook order
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);

  if (!open) return null;

  const currency =
    CURRENCIES.find((c) => c.code === form.salaryCurrency) || CURRENCIES[0];

  const set = (k, v) => {
    setForm((s) => ({ ...s, [k]: v }));
    // clear per-field error as the user edits
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const hasChanges = () => JSON.stringify(form) !== JSON.stringify(EMPTY_FORM);

  function requestClose() {
    if (saving) return;
    if (hasChanges()) setShowConfirm(true);
    else {
      setErrors({});
      setMsg(null);
      onClose();
    }
  }

  function discardAndClose() {
    setShowConfirm(false);
    setErrors({});
    setMsg(null);
    setForm(EMPTY_FORM);
    onClose();
  }

  // helper: are ALL fields filled (non-empty)?
  function allFilled() {
    // everything must be non-empty string
    for (const k of Object.keys(EMPTY_FORM)) {
      if (String(form[k]).trim() === "") return false;
    }
    return true;
  }

  function validate() {
    const e = {};
    // required checks
    if (!form.title.trim()) e.title = "Job title is required.";
    if (!form.workType.trim()) e.workType = "Work type is required.";
    if (!form.salaryCurrency.trim()) e.salaryCurrency = "Currency is required.";
    if (!form.startDate.trim()) e.startDate = "Start date is required.";
    if (!form.durationMonths.toString().trim()) e.durationMonths = "Duration is required.";
    if (!form.location.trim()) e.location = "Location is required.";
    if (!form.description.trim()) e.description = "Description is required.";
    if (!form.tags.trim()) e.tags = "At least one tag is required.";

    // numeric constraints (salary & duration)
    const min = form.salaryMin !== "" ? Number(form.salaryMin) : NaN;
    const max = form.salaryMax !== "" ? Number(form.salaryMax) : NaN;
    const dur = form.durationMonths !== "" ? Number(form.durationMonths) : NaN;

    if (isNaN(min)) e.salaryMin = "Salary min is required.";
    if (isNaN(max)) e.salaryMax = "Salary max is required.";
    if (!isNaN(min) && min < 0) e.salaryMin = "Must be ≥ 0.";
    if (!isNaN(max) && max < 0) e.salaryMax = "Must be ≥ 0.";
    if (!isNaN(min) && !isNaN(max) && max < min) e.salaryMax = "Max must be ≥ Min.";

    if (isNaN(dur)) e.durationMonths = "Duration is required.";
    if (!isNaN(dur) && dur < 0) e.durationMonths = "Must be ≥ 0.";

    // date validity
    if (form.startDate) {
      const d = new Date(form.startDate);
      if (isNaN(d.getTime())) e.startDate = "Invalid date.";
    }

    setErrors(e);
    return Object.keys(e).filter((k) => e[k]).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    setMsg(null);

    if (!validate()) return;

    try {
      setSaving(true);

      const payload = {
        title: form.title.trim(),
        salaryCurrency: form.salaryCurrency,
        salaryMin: Number(form.salaryMin),
        salaryMax: Number(form.salaryMax),
        startDate: form.startDate,
        durationMonths: Number(form.durationMonths),
        location: form.location.trim(),
        workType: form.workType,
        description: form.description.trim(),
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };

      const res = await fetch(`${API_BASE}/api/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to post job");

      // success -> reset + close
      setForm(EMPTY_FORM);
      setErrors({});
      setMsg("✅ Job posted");
      onCreated?.(data.job);
      onClose();
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  // Disable submit unless all fields filled AND current constraints pass
  const canSubmit =
    allFilled() &&
    !errors.title &&
    !errors.salaryMin &&
    !errors.salaryMax &&
    !errors.salaryCurrency &&
    !errors.startDate &&
    !errors.durationMonths &&
    !errors.location &&
    !errors.workType &&
    !errors.description &&
    !errors.tags;

  const inputCls = (hasErr) =>
    `w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 ${
      hasErr ? "border-red-400" : "border-gray-200"
    }`;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg relative">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Post New Job</h3>
          <button
            onClick={requestClose}
            className="text-gray-500 hover:text-gray-700"
            type="button"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <Field label="Job Title" error={errors.title} required>
            <input
              className={inputCls(!!errors.title)}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
            />
          </Field>

          {/* Work Type */}
          <Field label="Work Type" error={errors.workType} required>
            <select
              className={inputCls(!!errors.workType)}
              value={form.workType}
              onChange={(e) => set("workType", e.target.value)}
              required
            >
              <option>On-site</option>
              <option>Hybrid</option>
              <option>Remote</option>
            </select>
          </Field>

          {/* Currency */}
          <Field label="Currency" error={errors.salaryCurrency} required>
            <select
              className={inputCls(!!errors.salaryCurrency)}
              value={form.salaryCurrency}
              onChange={(e) => set("salaryCurrency", e.target.value)}
              required
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          {/* Salary Min with symbol */}
          <Field label="Salary Min" error={errors.salaryMin} required>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {currency.symbol}
              </span>
              <input
                className={`${inputCls(!!errors.salaryMin)} pl-8`}
                type="number"
                min="0"
                value={form.salaryMin}
                onChange={(e) => set("salaryMin", e.target.value)}
                required
              />
            </div>
          </Field>

          {/* Salary Max with symbol */}
          <Field label="Salary Max" error={errors.salaryMax} required>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {currency.symbol}
              </span>
              <input
                className={`${inputCls(!!errors.salaryMax)} pl-8`}
                type="number"
                min="0"
                value={form.salaryMax}
                onChange={(e) => set("salaryMax", e.target.value)}
                required
              />
            </div>
          </Field>

          {/* Start Date */}
          <Field label="Start Date" error={errors.startDate} required>
            <input
              className={inputCls(!!errors.startDate)}
              type="date"
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              required
            />
          </Field>

          {/* Duration */}
          <Field label="Duration (months)" error={errors.durationMonths} required>
            <input
              className={inputCls(!!errors.durationMonths)}
              type="number"
              min="0"
              value={form.durationMonths}
              onChange={(e) => set("durationMonths", e.target.value)}
              required
            />
          </Field>

          {/* Location */}
          <Field label="Location" error={errors.location} required>
            <input
              className={inputCls(!!errors.location)}
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="City, Country"
              required
            />
          </Field>

          {/* Description (full width) */}
          <div className="md:col-span-2">
            <Field label="Description" error={errors.description} required>
              <textarea
                className={`${inputCls(!!errors.description)} min-h-[120px]`}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                required
              />
            </Field>
          </div>

          {/* Tags (full width) */}
          <div className="md:col-span-2">
            <Field label="Tags (comma separated)" error={errors.tags} required>
              <input
                className={inputCls(!!errors.tags)}
                placeholder="React, Node.js, Internship"
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                required
              />
            </Field>
          </div>

          {msg && <div className="md:col-span-2 text-sm">{msg}</div>}

          <div className="md:col-span-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={requestClose}
              className="px-4 py-2 rounded-md border"
            >
              Cancel
            </button>
            <button
              disabled={saving || !canSubmit}
              className="px-4 py-2 rounded-md bg-[#F37526] text-white disabled:opacity-60"
            >
              {saving ? "Posting…" : "Post Job"}
            </button>
          </div>
        </form>
      </div>

      {/* Confirm discard */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-xl">
            <div className="px-5 py-4 border-b">
              <h4 className="font-semibold">Discard changes?</h4>
            </div>
            <div className="px-5 py-4 text-sm text-gray-700">
              You have unsaved information. Do you want to discard it?
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-md border"
                onClick={() => setShowConfirm(false)}
              >
                Keep Editing
              </button>
              <button
                className="px-4 py-2 rounded-md bg-red-600 text-white"
                onClick={discardAndClose}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, error, required, children }) {
  return (
    <label className="block text-sm">
      <span className="text-gray-700">
        {label}
        {required && " *"}
      </span>
      <div className="mt-1">{children}</div>
      {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
    </label>
  );
}
