import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const PESO = "₱";

/** Department options (frontend). Includes "Other". */
const DEPARTMENTS = [
  "Engineering",
  "IT",
  "Design",
  "Marketing",
  "HR",
  "Finance",
  "Operations",
  "Other",
];

const EDUCATION_LEVELS = ["High School", "College", "Graduate"];

// ✅ ADDED: simple date formatter for Review step
const fmtDate = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const EMPTY_FORM = {
 
  title: "",
  department: "",        
  otherDepartment: "",    
  workType: "On-site",
  location: "",
  jobType: "Full-time",
  salaryMax: "",
  description: "",
  responsibilities: [],
  offers: [],
  skills: "",
  requirements: [], 
  educationLevel: [],     
  languages: "",            
  experienceLevel: "",      
  screeningQuestions: [],    

  // ✅ ADDED: timeline fields
  startDateFrom: "",          // "YYYY-MM-DD"
  startDateTo: "",            // "YYYY-MM-DD"
  applicationDeadline: "",    // "YYYY-MM-DD"
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

export default function PostJobPage({ token, onCreated }) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [reqDraft, setReqDraft] = useState("");
  const [respDraft, setRespDraft] = useState("");
  const [offerDraft, setOfferDraft] = useState("");
  const [screenDraft, setScreenDraft] = useState("");
  const [currentStep, setCurrentStep] = useState(1); // 1..4
  const [submitToastId, setSubmitToastId] = useState(null); // ✅ ADDED: track loading toast

  const set = (k, v) => {
    setForm((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const pushIfNotEmpty = (key, value) => {
    const v = String(value ?? "").trim();
    if (!v) return;
    setForm((s) => ({ ...s, [key]: [...s[key], v] }));
  };

  const removeAt = (key, idx) => {
    setForm((s) => ({
      ...s,
      [key]: s[key].filter((_, i) => i !== idx),
    }));
  };

  const toggleInArray = (key, value) => {
    setForm((s) => {
      const exists = s[key].includes(value);
      return {
        ...s,
        [key]: exists ? s[key].filter((x) => x !== value) : [...s[key], value],
      };
    });
  };

  /* ── Per-step validation for Next/Back control ───────────────────────── */
  const validateStep = (step) => {
    const e = {};
    if (step === 1) {
      if (!form.title.trim()) e.title = "Job title is required.";
      if (!form.department.trim()) e.department = "Department is required.";
      if (form.department === "Other" && !form.otherDepartment.trim()) {
        e.otherDepartment = "Please specify the department.";
      }
      if (!form.location.trim()) e.location = "Location is required.";
      if (!form.jobType.trim()) e.jobType = "Job type is required.";
      if (!form.workType.trim()) e.workType = "Work type is required.";
      if (!String(form.salaryMax).trim())
        e.salaryMax = "Salary max is required.";
      const max = Number(form.salaryMax);
      if (isNaN(max) || max < 0) e.salaryMax = "Must be a number ≥ 0.";

      // ✅ ADDED: timeline required + logical checks
      if (!String(form.startDateFrom).trim()) e.startDateFrom = "Start date (from) is required.";
      if (!String(form.startDateTo).trim()) e.startDateTo = "Start date (to) is required.";
      if (!String(form.applicationDeadline).trim())
        e.applicationDeadline = "Application deadline is required.";
      // only check order if all present
      if (!e.startDateFrom && !e.startDateTo) {
        const from = new Date(form.startDateFrom);
        const to = new Date(form.startDateTo);
        if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
          if (from > to) e.startDateTo = "End of start range must be on/after the start.";
        }
      }
      if (!e.applicationDeadline && !e.startDateTo) {
        const dl = new Date(form.applicationDeadline);
        const to = new Date(form.startDateTo);
        if (!Number.isNaN(dl.getTime()) && !Number.isNaN(to.getTime())) {
          // soft guard; comment if not desired
          // if (dl > to) e.applicationDeadline = "Deadline should be on/before the last possible start date.";
        }
      }
    }
    if (step === 2) {
      if (!form.description.trim())
        e.description = "Job description details are required.";
      if (!form.responsibilities.length)
        e.responsibilities = "Add at least one responsibility.";
      if (!form.offers.length) e.offers = "Add at least one offer.";
    }
    if (step === 3) {
      if (!form.skills.trim())
        e.skills = "Add required skills (comma separated).";
      if (!form.requirements.length)
        e.requirements = "Add at least one other requirement.";
      // experienceLevel is optional for now (until backend supports)
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Full validation as safety on final Submit ───────────────────────── */
  function validateAll() {
    const e = {};
    if (!form.title.trim()) e.title = "Job title is required.";
    if (!form.department.trim()) e.department = "Job Category is required.";
    if (form.department === "Other" && !form.otherDepartment.trim()) {
      e.otherDepartment = "Please specify the Job Category.";
    }
    if (!form.workType.trim()) e.workType = "Work type is required.";
    if (!form.location.trim()) e.location = "Location is required.";
    if (!form.jobType.trim()) e.jobType = "Job type is required.";
    if (!String(form.salaryMax).trim()) e.salaryMax = "Salary max is required.";
    const max = Number(form.salaryMax);
    if (isNaN(max) || max < 0) e.salaryMax = "Must be a number ≥ 0.";
    if (!form.description.trim()) e.description = "Description is required.";
    if (!form.responsibilities.length)
      e.responsibilities = "Add at least one responsibility.";
    if (!form.offers.length) e.offers = "Add at least one offer.";
    if (!form.skills.trim()) e.skills = "Skills are required.";
    if (!form.requirements.length)
      e.requirements = "Add at least one other requirement.";

    // ✅ ADDED: final checks for dates
    if (!String(form.startDateFrom).trim()) e.startDateFrom = "Start date (from) is required.";
    if (!String(form.startDateTo).trim()) e.startDateTo = "Start date (to) is required.";
    if (!String(form.applicationDeadline).trim())
      e.applicationDeadline = "Application deadline is required.";
    if (!e.startDateFrom && !e.startDateTo) {
      const from = new Date(form.startDateFrom);
      const to = new Date(form.startDateTo);
      if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
        if (from > to) e.startDateTo = "End of start range must be on/after the start.";
      } else {
        if (Number.isNaN(from.getTime())) e.startDateFrom = "Invalid date.";
        if (Number.isNaN(to.getTime())) e.startDateTo = "Invalid date.";
      }
    }
    if (!e.applicationDeadline) {
      const dl = new Date(form.applicationDeadline);
      if (Number.isNaN(dl.getTime())) e.applicationDeadline = "Invalid date.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ── Submit to MVC backend (/api/jobs) ───────────────────────────────── */
  async function submit(e) {
    e.preventDefault();

    setMsg(null);
    if (!validateAll()) {
      const order = [1, 2, 3];
      for (const st of order) {
        if (!validateStep(st)) {
          setCurrentStep(st);
          break;
        }
      }
      // ✅ ADDED: toast on validation fail
      toast.error("Please complete the required fields before submitting.", { autoClose: 2500 });
      return;
    }

    try {
      setSaving(true);

      // ✅ ADDED: show loading toast while submitting
      const tid = toast.loading("Submitting job…");
      setSubmitToastId(tid);

      const departmentValue =
        form.department === "Other"
          ? form.otherDepartment.trim()
          : form.department.trim();

      const payload = {
        title: form.title.trim(),
        department: departmentValue,                       // send the real value
        workType: form.workType,
        location: form.location.trim(),
        jobType: form.jobType,
        salaryMax: Number(form.salaryMax),
        description: form.description.trim(),
        responsibilities: form.responsibilities,
        offers: form.offers,
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        requirements: form.requirements,
        educationLevel: form.educationLevel,
        languages: form.languages
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        experienceLevel: form.experienceLevel || undefined, // NEW (optional)
        screeningQuestions: form.screeningQuestions,

        // ✅ ADDED: send to backend exactly as controller expects
        startDateFrom: form.startDateFrom,               // "YYYY-MM-DD"
        startDateTo: form.startDateTo,                   // "YYYY-MM-DD"
        applicationDeadline: form.applicationDeadline,   // "YYYY-MM-DD"
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
      setScreenDraft("");
      setErrors({});
      setMsg("✅ Job posted successfully");
      setCurrentStep(1);
      onCreated?.(data.job);

      // ✅ ADDED: success toast update
      toast.update(tid, {
        render: "Job posted successfully!",
        type: "success",
        isLoading: false,
        autoClose: 2200,
        closeOnClick: true,
      });
    } catch (err) {
      setMsg(`❌ ${err.message}`);

      // ✅ ADDED: error toast update
      if (submitToastId) {
        toast.update(submitToastId, {
          render: err.message || "Failed to post job",
          type: "error",
          isLoading: false,
          autoClose: 3500,
          closeOnClick: true,
        });
      } else {
        toast.error(err.message || "Failed to post job");
      }
    } finally {
      setSaving(false);
    }
  }

  const inputCls = (hasErr) =>
    `w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 ${
      hasErr ? "border-red-400" : "border-gray-200"
    }`;

  const skillsPreview = useMemo(
    () =>
      form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [form.skills]
  );

  const languagesPreview = useMemo(
    () =>
      form.languages
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [form.languages]
  );

  /* ───────────────────────── UI (InternConnect theme) ─────────────────── */

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Create New Job Posting</h2>

      {/* Stepper */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-6 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          {[
            { id: 1, label: "Basic Info" },
            { id: 2, label: "Description" },
            { id: 3, label: "Requirements" },
            { id: 4, label: "Review" },
          ].map((s, idx, arr) => (
            <div key={s.id} className="flex-1 flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`h-7 w-7 flex items-center justify-center rounded-full border ${
                    currentStep >= s.id
                      ? "bg-[#173B8A] text-white border-[#173B8A]"
                      : "bg-white text-gray-500 border-gray-300"
                  }`}
                >
                  {s.id}
                </div>
                <span
                  className={`${
                    currentStep === s.id
                      ? "text-[#173B8A] font-medium"
                      : "text-gray-600"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < arr.length - 1 && (
                <div className="flex-1 mx-3 h-px bg-gray-200" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* STEP CONTENT (1–3 non-form, 4 = form) */}
      {currentStep < 4 && (
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          {currentStep === 1 && (
            <>
              <SectionTitle>Basic Info</SectionTitle>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Job Title" error={errors.title} required>
                  <input
                    className={inputCls(!!errors.title)}
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="e.g., Junior Frontend Engineer"
                  />
                </Field>

                {/* Department select + 'Other' input */}
                <Field label="Job Category" error={errors.department} required>
                  <select
                    className={inputCls(!!errors.department)}
                    value={form.department}
                    onChange={(e) => set("department", e.target.value)}
                  >
                    <option value="">Select Job Category</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  {form.department === "Other" && (
                    <div className="mt-2">
                      <input
                        className={inputCls(!!errors.otherDepartment)}
                        placeholder="Type your department"
                        value={form.otherDepartment}
                        onChange={(e) => set("otherDepartment", e.target.value)}
                        autoFocus
                      />
                      {errors.otherDepartment && (
                        <div className="mt-1 text-xs text-red-600">
                          {errors.otherDepartment}
                        </div>
                      )}
                    </div>
                  )}
                </Field>

                <Field label="Location" error={errors.location} required>
                  <input
                    className={inputCls(!!errors.location)}
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                    placeholder="e.g., Makati, PH or Remote"
                  />
                </Field>

                <Field label="Employment Type" error={errors.jobType} required>
                  <div className="flex flex-wrap gap-4">
                    {["Full-time", "Part-time", "Contract", "Internship"].map(
                      (opt) => (
                        <Radio
                          key={opt}
                          name="jobType"
                          label={opt}
                          checked={form.jobType === opt}
                          onChange={() => set("jobType", opt)}
                        />
                      )
                    )}
                  </div>
                </Field>

                {/* Salary Max with peso prefix */}
                <Field
                  label="Salary Range (Max)"
                  error={errors.salaryMax}
                  required
                >
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {PESO}
                    </span>
                    <input
                      className={`${inputCls(!!errors.salaryMax)} pl-8`}
                      type="number"
                      min="0"
                      value={form.salaryMax}
                      onChange={(e) => set("salaryMax", e.target.value)}
                      placeholder="e.g., 12000"
                    />
                  </div>
                </Field>

                <Field label="Work Type" error={errors.workType} required>
                  <div className="flex flex-wrap gap-4">
                    {["On-site", "Hybrid", "Remote"].map((opt) => (
                      <Radio
                        key={opt}
                        name="workType"
                        label={opt}
                        checked={form.workType === opt}
                        onChange={() => set("workType", opt)}
                      />
                    ))}
                  </div>
                </Field>

                {/* ✅ ADDED: Start date range */}
                <Field label="Start Date (From)" error={errors.startDateFrom} required>
                  <input
                    type="date"
                    className={inputCls(!!errors.startDateFrom)}
                    value={form.startDateFrom}
                    onChange={(e) => set("startDateFrom", e.target.value)}
                  />
                </Field>

                <Field label="Start Date (To)" error={errors.startDateTo} required>
                  <input
                    type="date"
                    className={inputCls(!!errors.startDateTo)}
                    value={form.startDateTo}
                    onChange={(e) => set("startDateTo", e.target.value)}
                    min={form.startDateFrom || undefined}
                  />
                </Field>

                {/* ✅ ADDED: Application deadline */}
                <Field label="Application Deadline" error={errors.applicationDeadline} required>
                  <input
                    type="date"
                    className={inputCls(!!errors.applicationDeadline)}
                    value={form.applicationDeadline}
                    onChange={(e) => set("applicationDeadline", e.target.value)}
                    // max={form.startDateTo || undefined} // optional soft limit
                  />
                </Field>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <SectionTitle>Description</SectionTitle>

              <div className="space-y-6">
                <Field
                  label="Job Description Details"
                  error={errors.description}
                  required
                >
                  <textarea
                    className={`${inputCls(!!errors.description)} min-h-[160px]`}
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Describe the role, impact, team, and tools…"
                  />
                </Field>

                <Field
                  label="Responsibilities (list)"
                  error={errors.responsibilities}
                  required
                >
                  <ListEditor
                    draft={respDraft}
                    setDraft={setRespDraft}
                    onAdd={() => {
                      pushIfNotEmpty("responsibilities", respDraft);
                      setRespDraft("");
                    }}
                    items={form.responsibilities}
                    onRemove={(idx) => removeAt("responsibilities", idx)}
                    placeholder="e.g., Build UI, write tests"
                  />
                </Field>

                <Field
                  label="What we offer (list)"
                  error={errors.offers}
                  required
                >
                  <ListEditor
                    draft={offerDraft}
                    setDraft={setOfferDraft}
                    onAdd={() => {
                      pushIfNotEmpty("offers", offerDraft);
                      setOfferDraft("");
                    }}
                    items={form.offers}
                    onRemove={(idx) => removeAt("offers", idx)}
                    placeholder="e.g., allowance, mentorship, certificate"
                  />
                </Field>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <SectionTitle>Requirements</SectionTitle>

              <div className="space-y-6">
                <Field label="Required Skills" error={errors.skills} required>
                  <div className="space-y-2">
                    <input
                      className={inputCls(!!errors.skills)}
                      placeholder="e.g., React, Node.js, TypeScript"
                      value={form.skills}
                      onChange={(e) => set("skills", e.target.value)}
                    />
                    {!!skillsPreview.length && (
                      <div className="flex flex-wrap gap-2">
                        {skillsPreview.map((s, i) => (
                          <span
                            key={`${s}-${i}`}
                            className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Tip: separate skills with commas.
                    </p>
                  </div>
                </Field>

                <Field
                  label="Education Level (select all that apply)"
                  error={errors.educationLevel}
                >
                  <div className="flex flex-wrap gap-4">
                    {EDUCATION_LEVELS.map((lvl) => (
                      <label
                        key={lvl}
                        className="inline-flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={form.educationLevel.includes(lvl)}
                          onChange={() => toggleInArray("educationLevel", lvl)}
                          className="h-4 w-4 text-[#173B8A] focus:ring-[#173B8A]"
                        />
                        <span className="text-sm text-gray-700">{lvl}</span>
                      </label>
                    ))}
                  </div>
                </Field>

                <Field label="Languages (comma separated)">
                  <div className="space-y-2">
                    <input
                      className={inputCls(false)}
                      placeholder="e.g., English, Filipino"
                      value={form.languages}
                      onChange={(e) => set("languages", e.target.value)}
                    />
                    {!!languagesPreview.length && (
                      <div className="flex flex-wrap gap-2">
                        {languagesPreview.map((s, i) => (
                          <span
                            key={`lang-${i}`}
                            className="text-xs px-2 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Field>

                <Field label="Experience Level">
                  <div className="flex flex-wrap gap-4">
                    <Radio
                      name="expLvl"
                      label="Entry-level (0–2 yrs)"
                      checked={form.experienceLevel === "Entry"}
                      onChange={() => set("experienceLevel", "Entry")}
                    />
                    <Radio
                      name="expLvl"
                      label="Mid-level (3–5 yrs)"
                      checked={form.experienceLevel === "Mid"}
                      onChange={() => set("experienceLevel", "Mid")}
                    />
                    <Radio
                      name="expLvl"
                      label="Senior-level (6+ yrs)"
                      checked={form.experienceLevel === "Senior"}
                      onChange={() => set("experienceLevel", "Senior")}
                    />
                  </div>
                  {/* Optional: hint */}
                  <p className="text-xs text-gray-500 mt-1">
                    You can leave this empty if not required.
                  </p>
                </Field>

                <Field label="Screening Questions">
                  <ListEditor
                    draft={screenDraft}
                    setDraft={setScreenDraft}
                    onAdd={() => {
                      pushIfNotEmpty("screeningQuestions", screenDraft);
                      setScreenDraft("");
                    }}
                    items={form.screeningQuestions}
                    onRemove={(idx) => removeAt("screeningQuestions", idx)}
                    placeholder="e.g., Why this role? Paste your portfolio link."
                  />
                </Field>

                <Field
                  label="Other requirements (list)"
                  error={errors.requirements}
                  required
                >
                  <ListEditor
                    draft={reqDraft}
                    setDraft={setReqDraft}
                    onAdd={() => {
                      pushIfNotEmpty("requirements", reqDraft);
                      setReqDraft("");
                    }}
                    items={form.requirements}
                    onRemove={(idx) => removeAt("requirements", idx)}
                    placeholder="e.g., 3rd year BSCS, basic Git"
                  />
                </Field>
              </div>
            </>
          )}

          {msg && <div className="mt-4 text-sm">{msg}</div>}
        </div>
      )}

      {currentStep === 4 && (
        <form
          onSubmit={submit}
          className="bg-white p-6 rounded-xl shadow border border-gray-200"
        >
          {/* TITLE-LIKE SECTION HEADERS */}
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Job Description
          </h3>

          <p className="text-sm leading-6 text-gray-800 mb-6 whitespace-pre-line">
            {form.description || "—"}
          </p>

          <h4 className="text-base font-semibold text-gray-900 mb-2">
            Key Responsibilities
          </h4>
          {form.responsibilities.length ? (
            <ul className="list-disc pl-6 space-y-1 mb-8 text-sm text-gray-800">
              {form.responsibilities.map((x, i) => (
                <li key={`resp-r-${i}`}>{x}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 mb-8">—</p>
          )}

          <hr className="my-6 border-gray-200" />

          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Qualifications & Requirements
          </h3>

          <h5 className="text-sm font-semibold text-gray-900 mb-2">
            Required Skills:
          </h5>
          {skillsPreview.length ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {skillsPreview.map((s, i) => (
                <span
                  key={`skill-${i}`}
                  className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-800"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">—</p>
          )}

          {/* Education & Languages & Experience Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Meta
              label="Education Level"
              value={
                form.educationLevel.length
                  ? form.educationLevel.join(", ")
                  : "—"
              }
            />
            <Meta
              label="Languages"
              value={
                languagesPreview.length ? languagesPreview.join(", ") : "—"
              }
            />
            <Meta
              label="Experience Level"
              value={
                form.experienceLevel === "Entry"
                  ? "Entry-level (0–2 yrs)"
                  : form.experienceLevel === "Mid"
                  ? "Mid-level (3–5 yrs)"
                  : form.experienceLevel === "Senior"
                  ? "Senior-level (6+ yrs)"
                  : "—"
              }
            />
          </div>

          <h5 className="text-sm font-semibold text-gray-900 mt-4 mb-2">
            Other Requirements:
          </h5>
          {form.requirements.length ? (
            <ul className="list-disc pl-6 space-y-1 mb-6 text-sm text-gray-800">
              {form.requirements.map((x, i) => (
                <li key={`req-r-${i}`}>{x}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 mb-6">—</p>
          )}

          {/* Screening Questions */}
          <h5 className="text-sm font-semibold text-gray-900 mb-2">
            Screening Questions:
          </h5>
          {form.screeningQuestions.length ? (
            <ul className="list-disc pl-6 space-y-1 mb-6 text-sm text-gray-800">
              {form.screeningQuestions.map((x, i) => (
                <li key={`sq-r-${i}`}>{x}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 mb-6">—</p>
          )}

          <hr className="my-6 border-gray-200" />

          {/* Basic info summary line (meta) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-800">
            <Meta label="Job Title" value={form.title} />
            <Meta
              label="Department"
              value={
                form.department === "Other"
                  ? form.otherDepartment || "—"
                  : form.department || "—"
              }
            />
            <Meta label="Location" value={form.location} />
            <Meta label="Employment Type" value={form.jobType} />
            <Meta
              label="Salary (Max)"
              value={form.salaryMax ? `${PESO}${form.salaryMax}` : "—"}
            />
            <Meta label="Work Type" value={form.workType} />
          </div>

          {/* ✅ ADDED: Timeline summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-800 mt-4">
            <Meta label="Start Date (From)" value={fmtDate(form.startDateFrom) || "—"} />
            <Meta label="Start Date (To)" value={fmtDate(form.startDateTo) || "—"} />
            <Meta label="Application Deadline" value={fmtDate(form.applicationDeadline) || "—"} />
          </div>

          {/* Submit only — navigation outside below */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-md bg-[#F37526] text-white disabled:opacity-60"
            >
              {saving ? "Submitting…" : "Submit Job"}
            </button>
          </div>

          {msg && <div className="mt-4 text-sm">{msg}</div>}
        </form>
      )}

      {/* ── Global footer (outside any form) with navigation & Next ───────── */}
      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
          className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          disabled={currentStep === 1 || saving}
        >
          Previous
        </button>

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={() => {
              if (validateStep(currentStep)) {
                setCurrentStep((s) => Math.min(4, s + 1));
              } else {
                // ✅ ADDED: gentle toast when trying to go next with invalid fields
                toast.warn("Please finish the required fields in this step.", { autoClose: 2000 });
              }
            }}
            className="px-4 py-2 rounded-md bg-[#173B8A] text-white hover:opacity-95 disabled:opacity-60"
            disabled={saving}
          >
            Next
          </button>
        ) : (
          <span className="text-sm text-gray-500">
            Ready? Click <span className="font-medium text-gray-700">Submit Job</span>.
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Small UI helpers ──────────────────────────────────────────────────── */

function SectionTitle({ children }) {
  return (
    <h3 className="text-lg font-semibold text-gray-800 mb-4">{children}</h3>
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

function Radio({ name, label, checked, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 text-[#173B8A] focus:ring-[#173B8A]"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

function ListEditor({ draft, setDraft, onAdd, items, onRemove, placeholder }) {
  return (
    <>
      <div className="flex gap-2">
        <input
          className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 border-gray-200"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          type="button"
          className="px-3 py-2 rounded-md bg-[#173B8A] text-white"
          onClick={onAdd}
        >
          Add
        </button>
      </div>
      <ul className="mt-2 space-y-1">
        {items.map((it, idx) => (
          <li
            key={`${placeholder}-${idx}`}
            className="flex items-center justify-between bg-gray-50 rounded px-3 py-2"
          >
            <span>{it}</span>
            <button
              type="button"
              className="text-red-600 hover:underline"
              onClick={() => onRemove(idx)}
            >
              remove
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ── Review document primitives ────────────────────────────────────────── */

function Meta({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value || "—"}</span>
    </div>
  );
}
