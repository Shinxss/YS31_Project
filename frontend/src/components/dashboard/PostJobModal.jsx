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
  workType: "On-site",
  location: "",
  durationMonths: "",
  salaryCurrency: "PHP",
  salaryMin: "",
  salaryMax: "",
  startDate: "",
  applicationDeadline: "",
  skills: "",
  description: "",
  requirements: [],
  responsibilities: [],
  offers: [],
};

function shallowEqualForm(a, b) {
  const keys = Object.keys(EMPTY_FORM);
  for (const k of keys) {
    const av = a[k];
    const bv = b[k];
    if (Array.isArray(av) && Array.isArray(bv)) {
      if (av.length !== bv.length) return false;
      for (let i = 0; i < av.length; i++) if (av[i] !== bv[i]) return false;
    } else if (String(av ?? "") !== String(bv ?? "")) {
      return false;
    }
  }
  return true;
}

export default function PostJobModal({ open, onClose, token, onCreated }) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [reqDraft, setReqDraft] = useState("");
  const [respDraft, setRespDraft] = useState("");
  const [offerDraft, setOfferDraft] = useState("");

  if (!open) return null;

  const currency = CURRENCIES.find((c) => c.code === form.salaryCurrency) || CURRENCIES[0];

  const set = (k, v) => {
    setForm((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const hasChanges = () => !shallowEqualForm(form, EMPTY_FORM);

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
    setReqDraft("");
    setRespDraft("");
    setOfferDraft("");
    onClose();
  }

  const pushIfNotEmpty = (key, value) => {
    const v = value.trim();
    if (!v) return;
    setForm((s) => ({ ...s, [key]: [...s[key], v] }));
  };
  const removeAt = (key, idx) => {
    setForm((s) => ({
      ...s,
      [key]: s[key].filter((_, i) => i !== idx),
    }));
  };

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = "Job title is required.";
    if (!form.workType.trim()) e.workType = "Work type is required.";
    if (!form.location.trim()) e.location = "Location is required.";
    if (!String(form.durationMonths).trim()) e.durationMonths = "Duration is required.";
    if (!form.salaryCurrency.trim()) e.salaryCurrency = "Currency is required.";
    if (!String(form.salaryMin).trim()) e.salaryMin = "Salary min is required.";
    if (!String(form.salaryMax).trim()) e.salaryMax = "Salary max is required.";
    if (!form.startDate.trim()) e.startDate = "Start date is required.";
    if (!form.applicationDeadline.trim()) e.applicationDeadline = "Application deadline is required.";
    if (!form.skills.trim()) e.skills = "Skills are required.";
    if (!form.description.trim()) e.description = "Description is required.";
    if (!form.requirements.length) e.requirements = "Add at least one requirement.";
    if (!form.responsibilities.length) e.responsibilities = "Add at least one responsibility.";
    if (!form.offers.length) e.offers = "Add at least one company offer.";

    const min = Number(form.salaryMin);
    const max = Number(form.salaryMax);
    const dur = Number(form.durationMonths);
    if (isNaN(min) || min < 0) e.salaryMin = "Must be a number ≥ 0.";
    if (isNaN(max) || max < 0) e.salaryMax = "Must be a number ≥ 0.";
    if (!isNaN(min) && !isNaN(max) && max < min) e.salaryMax = "Max must be ≥ Min.";
    if (isNaN(dur) || dur <= 0) e.durationMonths = "Must be a number > 0.";

    const sd = new Date(form.startDate);
    const ad = new Date(form.applicationDeadline);
    if (isNaN(sd.getTime())) e.startDate = "Invalid date.";
    if (isNaN(ad.getTime())) e.applicationDeadline = "Invalid date.";
    if (!e.startDate && !e.applicationDeadline && ad > sd) {
      e.applicationDeadline = "Deadline must be on/before the start date.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!validate()) return;

    try {
      setSaving(true);

      const payload = {
        title: form.title.trim(),
        workType: form.workType,
        location: form.location.trim(),
        durationMonths: Number(form.durationMonths),
        salaryCurrency: form.salaryCurrency,
        salaryMin: Number(form.salaryMin),
        salaryMax: Number(form.salaryMax),
        startDate: form.startDate,
        applicationDeadline: form.applicationDeadline,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        description: form.description.trim(),
        requirements: form.requirements,
        responsibilities: form.responsibilities,
        offers: form.offers,
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

      setForm(EMPTY_FORM);
      setReqDraft("");
      setRespDraft("");
      setOfferDraft("");
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

  const inputCls = (hasErr) =>
    `w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 ${
      hasErr ? "border-red-400" : "border-gray-200"
    }`;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      {/* modal */}
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg relative flex flex-col max-h-[90vh]">
        {/* header (non-scroll) */}
        <div className="px-6 py-4 border-b flex items-center justify-between flex-none">
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

        {/* body (scrollable) */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Job Title" error={errors.title} required>
              <input className={inputCls(!!errors.title)} value={form.title} onChange={(e) => set("title", e.target.value)} />
            </Field>

            <Field label="Work Type" error={errors.workType} required>
              <select className={inputCls(!!errors.workType)} value={form.workType} onChange={(e) => set("workType", e.target.value)}>
                <option>On-site</option>
                <option>Hybrid</option>
                <option>Remote</option>
              </select>
            </Field>

            <Field label="Location" error={errors.location} required>
              <input className={inputCls(!!errors.location)} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="City, Country" />
            </Field>

            <Field label="Duration (months)" error={errors.durationMonths} required>
              <input className={inputCls(!!errors.durationMonths)} type="number" min="1" value={form.durationMonths} onChange={(e) => set("durationMonths", e.target.value)} />
            </Field>

            <Field label="Currency" error={errors.salaryCurrency} required>
              <select className={inputCls(!!errors.salaryCurrency)} value={form.salaryCurrency} onChange={(e) => set("salaryCurrency", e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Salary Min" error={errors.salaryMin} required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{currency.symbol}</span>
                <input className={`${inputCls(!!errors.salaryMin)} pl-8`} type="number" min="0" value={form.salaryMin} onChange={(e) => set("salaryMin", e.target.value)} />
              </div>
            </Field>

            <Field label="Salary Max" error={errors.salaryMax} required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{currency.symbol}</span>
                <input className={`${inputCls(!!errors.salaryMax)} pl-8`} type="number" min="0" value={form.salaryMax} onChange={(e) => set("salaryMax", e.target.value)} />
              </div>
            </Field>

            <Field label="Start Date" error={errors.startDate} required>
              <input className={inputCls(!!errors.startDate)} type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </Field>

            <Field label="Application Deadline" error={errors.applicationDeadline} required>
              <input className={inputCls(!!errors.applicationDeadline)} type="date" value={form.applicationDeadline} onChange={(e) => set("applicationDeadline", e.target.value)} />
            </Field>

            <div className="md:col-span-2">
              <Field label="Skills (comma separated)" error={errors.skills} required>
                <input className={inputCls(!!errors.skills)} placeholder="React, Node.js, Communication" value={form.skills} onChange={(e) => set("skills", e.target.value)} />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="Job Description" error={errors.description} required>
                <textarea className={`${inputCls(!!errors.description)} min-h-[120px]`} value={form.description} onChange={(e) => set("description", e.target.value)} />
              </Field>
            </div>

            {/* Requirements */}
            <div className="md:col-span-2">
              <Field label="Requirements (list)" error={errors.requirements} required>
                <div className="flex gap-2">
                  <input className={inputCls(false)} placeholder="e.g., 3rd year BSCS, basic Git" value={reqDraft} onChange={(e) => setReqDraft(e.target.value)} />
                  <button type="button" className="px-3 py-2 rounded-md bg-[#173B8A] text-white" onClick={() => { pushIfNotEmpty("requirements", reqDraft); setReqDraft(""); }}>
                    Add
                  </button>
                </div>
                <ul className="mt-2 space-y-1">
                  {form.requirements.map((it, idx) => (
                    <li key={`req-${idx}`} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                      <span>{it}</span>
                      <button type="button" className="text-red-600 hover:underline" onClick={() => removeAt("requirements", idx)}>remove</button>
                    </li>
                  ))}
                </ul>
              </Field>
            </div>

            {/* Responsibilities */}
            <div className="md:col-span-2">
              <Field label="Responsibilities (list)" error={errors.responsibilities} required>
                <div className="flex gap-2">
                  <input className={inputCls(false)} placeholder="e.g., build UI, write tests" value={respDraft} onChange={(e) => setRespDraft(e.target.value)} />
                  <button type="button" className="px-3 py-2 rounded-md bg-[#173B8A] text-white" onClick={() => { pushIfNotEmpty("responsibilities", respDraft); setRespDraft(""); }}>
                    Add
                  </button>
                </div>
                <ul className="mt-2 space-y-1">
                  {form.responsibilities.map((it, idx) => (
                    <li key={`resp-${idx}`} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                      <span>{it}</span>
                      <button type="button" className="text-red-600 hover:underline" onClick={() => removeAt("responsibilities", idx)}>remove</button>
                    </li>
                  ))}
                </ul>
              </Field>
            </div>

            {/* Offers */}
            <div className="md:col-span-2">
              <Field label="What the company offers (list)" error={errors.offers} required>
                <div className="flex gap-2">
                  <input className={inputCls(false)} placeholder="e.g., allowance, mentorship, certificate" value={offerDraft} onChange={(e) => setOfferDraft(e.target.value)} />
                  <button type="button" className="px-3 py-2 rounded-md bg-[#173B8A] text-white" onClick={() => { pushIfNotEmpty("offers", offerDraft); setOfferDraft(""); }}>
                    Add
                  </button>
                </div>
                <ul className="mt-2 space-y-1">
                  {form.offers.map((it, idx) => (
                    <li key={`offer-${idx}`} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                      <span>{it}</span>
                      <button type="button" className="text-red-600 hover:underline" onClick={() => removeAt("offers", idx)}>remove</button>
                    </li>
                  ))}
                </ul>
              </Field>
            </div>

            {msg && <div className="md:col-span-2 text-sm">{msg}</div>}

            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={requestClose} className="px-4 py-2 rounded-md border">Cancel</button>
              <button disabled={saving} className="px-4 py-2 rounded-md bg-[#F37526] text-white disabled:opacity-60">
                {saving ? "Posting…" : "Post Job"}
              </button>
            </div>
          </form>
        </div>
      </div>

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
              <button className="px-4 py-2 rounded-md border" onClick={() => setShowConfirm(false)}>
                Keep Editing
              </button>
              <button className="px-4 py-2 rounded-md bg-red-600 text-white" onClick={discardAndClose}>
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
      <span className="text-gray-700 font-medium">
        {label}
        {required && " *"}
      </span>
      <div className="mt-1">{children}</div>
      {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
    </label>
  );
}
