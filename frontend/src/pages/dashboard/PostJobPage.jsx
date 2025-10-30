// src/pages/company/PostJobPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

/* ------------------------------------------------------------------ */
/* Config                                                             */
/* ------------------------------------------------------------------ */
const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:5000").replace(/\/+$/, "");
const PESO = "₱";

/** Department options shown in the UI */
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

/** Matches your Job schema enum */
const JOB_TYPES = ["Full-time", "Intern", "Part-time", "Contract"];

/** Matches your Job schema enum */
const WORK_TYPES = ["On-site", "Hybrid", "Remote"];

const EDUCATION_LEVELS_ROW1 = ["Junior High School", "Senior High School", "Vocational / Technical"];
const EDUCATION_LEVELS_ROW2 = ["College Level (Undergraduate)", "Bachelor’s Degree Graduate", "Master’s Degree"];

/* ------------------------------------------------------------------ */
/* Small helpers                                                      */
/* ------------------------------------------------------------------ */
const toYMD = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

const digits = (s) => (s ? String(s).replace(/[^\d.]/g, "") : "");

const splitCSV = (s) =>
  String(s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const arr = (v) => (Array.isArray(v) ? v : v ? [v] : []);

const fmtDatePretty = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

/** Best-effort GET for a job */
async function fetchJobById(id, headers) {
  const urls = [
    `${API_BASE}/api/company/jobs/${encodeURIComponent(id)}`,
    `${API_BASE}/api/company/job/${encodeURIComponent(id)}`,
    `${API_BASE}/api/jobs/${encodeURIComponent(id)}`,
  ];

  let lastErr = "Not found";
  for (const url of urls) {
    try {
      const r = await fetch(url, { credentials: "include", headers });
      const j = await r.json().catch(() => ({}));
      if (r.ok && (j?.job || j?._id || j?.id)) return j.job || j;
      lastErr = j?.message || `${r.status} ${r.statusText}`;
    } catch (e) {
      lastErr = e.message || lastErr;
    }
  }
  throw new Error(lastErr);
}

/* ------------------------------------------------------------------ */
/* Form model                                                         */
/* ------------------------------------------------------------------ */
const EMPTY_FORM = {
  // step 1
  title: "",
  department: "", // UI choice; when 'Other', use otherDepartment for real value
  otherDepartment: "",
  workType: "On-site",
  location: "",
  jobType: "Full-time",
  salaryMax: "",

  // step 2
  description: "",
  responsibilities: [],
  offers: [],

  // step 3
  skills: "", // UI comma string; convert to array for payload
  requirements: [],
  educationLevel: "",
  languages: "", // UI comma string; convert to array
  experienceLevel: "", // Entry | Mid | Senior
  screeningQuestions: [],

  // timeline
  startDateFrom: "", // YYYY-MM-DD
  startDateTo: "", // YYYY-MM-DD
  applicationDeadline: "", // YYYY-MM-DD
};

/** Normalize DB job -> UI form shape */
const normalizeJobToForm = (job = {}) => {
  const jt = job.jobType;
  const mappedJobType =
    jt === "Internship" ? "Intern" : JOB_TYPES.includes(jt) ? jt : "Full-time";

  return {
    title: job.title || "",
    department: DEPARTMENTS.includes(job.department) ? job.department : job.department ? "Other" : "",
    otherDepartment: DEPARTMENTS.includes(job.department) ? "" : job.department || "",

    workType: WORK_TYPES.includes(job.workType) ? job.workType : "On-site",
    location: job.location || "",
    jobType: mappedJobType,

    salaryMax: digits(job.salaryMax || job.salary || job.salaryRange || ""),

    description: job.description || "",

    responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities : [],
    offers: Array.isArray(job.offers) ? job.offers : [],

    skills: Array.isArray(job.skills) ? job.skills.join(", ") : "",
    requirements: Array.isArray(job.requirements) ? job.requirements : [],
    educationLevel: job.educationLevel || "",
    languages:
      Array.isArray(job.languages) && job.languages.length
        ? job.languages.join(", ")
        : typeof job.languages === "string"
        ? job.languages
        : "",
    experienceLevel: job.experienceLevel || "",
    screeningQuestions: Array.isArray(job.screeningQuestions) ? job.screeningQuestions : [],

    startDateFrom: toYMD(job.startDateRange?.from),
    startDateTo: toYMD(job.startDateRange?.to),
    applicationDeadline: toYMD(job.applicationDeadline),
  };
};

/* ------------------------------------------------------------------ */
/* Page component                                                     */
/* ------------------------------------------------------------------ */
export default function PostJobPage({ token: propToken, onCreated }) {
  const { id } = useParams(); // when editing => /company/post-job/:id
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { state } = useLocation();

  const token = useMemo(
    () =>
      propToken ||
      (typeof window !== "undefined" &&
        (localStorage.getItem("ic_company_token") || localStorage.getItem("ic_token"))) ||
      "",
    [propToken]
  );
  const authHeader = () => (token ? { Authorization: `Bearer ${token}` } : {});

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  // list editor drafts
  const [respDraft, setRespDraft] = useState("");
  const [offerDraft, setOfferDraft] = useState("");
  const [reqDraft, setReqDraft] = useState("");
  const [screenDraft, setScreenDraft] = useState("");

  // Prefill immediately from navigation state (from JobDetailPage "Edit")
  useEffect(() => {
    if (state?.job) setForm(normalizeJobToForm(state.job));
  }, [state?.job]);

  // If editing and no state, fetch job by id
  useEffect(() => {
    if (!isEdit || state?.job) return;
    let ignore = false;
    (async () => {
      try {
        const job = await fetchJobById(id, { ...authHeader() });
        if (!ignore) setForm(normalizeJobToForm(job));
      } catch (e) {
        if (!ignore) setMsg(`❌ ${e.message || "Failed to load job"}`);
      }
    })();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, id]);

  /* -------------------------------------------------------------- */
  /* Change helpers                                                 */
  /* -------------------------------------------------------------- */
  const setField = (k, v) => {
    setForm((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const pushIfNotEmpty = (key, value) => {
    const v = String(value ?? "").trim();
    if (!v) return;
    setForm((s) => ({ ...s, [key]: [...s[key], v] }));
  };

  const removeAt = (key, idx) => {
    setForm((s) => ({ ...s, [key]: s[key].filter((_, i) => i !== idx) }));
  };

  const toggleInArray = (key, value) => {
    setForm((s) => {
      const exists = s[key].includes(value);
      return { ...s, [key]: exists ? s[key].filter((x) => x !== value) : [...s[key], value] };
    });
  };

  /* -------------------------------------------------------------- */
  /* Validation                                                     */
  /* -------------------------------------------------------------- */
  const validateStep = (step) => {
    const e = {};
    if (step === 1) {
      if (!form.title.trim()) e.title = "Job title is required.";
      if (!form.department.trim()) e.department = "Job Category is required.";
      if (form.department === "Other" && !form.otherDepartment.trim())
        e.otherDepartment = "Please specify the Job Category.";
      if (!form.location.trim()) e.location = "Location is required.";
      if (!JOB_TYPES.includes(form.jobType)) e.jobType = "Choose a valid employment type.";
      if (!WORK_TYPES.includes(form.workType)) e.workType = "Choose a valid work type.";
      if (!String(form.salaryMax).trim()) e.salaryMax = "Salary max is required.";
      const max = Number(form.salaryMax);
      if (isNaN(max) || max < 0) e.salaryMax = "Must be a number ≥ 0.";

      if (!String(form.startDateFrom).trim()) e.startDateFrom = "Start date (from) is required.";
      if (!String(form.startDateTo).trim()) e.startDateTo = "Start date (to) is required.";
      if (!String(form.applicationDeadline).trim())
        e.applicationDeadline = "Application deadline is required.";

      // logical check
      if (!e.startDateFrom && !e.startDateTo) {
        const from = new Date(form.startDateFrom);
        const to = new Date(form.startDateTo);
        if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && from > to) {
          e.startDateTo = "End of start range must be on/after the start.";
        }
      }
    }
    if (step === 2) {
      if (!form.description.trim()) e.description = "Job description is required.";
      if (form.responsibilities.length < 5) e.responsibilities = "Add at least 5 responsibilities.";
      if (form.offers.length < 5) e.offers = "Add at least 5 offers.";
    }
    if (step === 3) {
      if (splitCSV(form.skills).length < 3) e.skills = "Add at least 3 required skills (comma separated).";
      if (form.requirements.length < 5) e.requirements = "Add at least 5 other requirements.";
      if (form.screeningQuestions.length < 1) e.screeningQuestions = "Add at least 1 screening question.";
      if (form.experienceLevel && !["Entry", "Mid", "Senior"].includes(form.experienceLevel)) {
        e.experienceLevel = "Choose Entry, Mid, or Senior.";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateAll = () => {
    const steps = [1, 2, 3];
    for (const s of steps) {
      if (!validateStep(s)) return false;
    }
    return true;
  };

  /* -------------------------------------------------------------- */
  /* Build payload for schema                                       */
  /* -------------------------------------------------------------- */
  const buildPayload = () => {
    const departmentValue =
      form.department === "Other" ? form.otherDepartment.trim() : form.department.trim();

    return {
      title: form.title.trim(),
      department: departmentValue,
      workType: form.workType, // "On-site" | "Hybrid" | "Remote"
      jobType: form.jobType, // "Full-time" | "Intern" | "Part-time" | "Contract"
      location: form.location.trim(),

      salaryMax: String(form.salaryMax).trim(), // setter in schema will pesoify

      description: form.description.trim(),

      responsibilities: form.responsibilities,
      offers: form.offers,

      skills: splitCSV(form.skills),
      requirements: form.requirements,

      educationLevel: form.educationLevel,
      languages: splitCSV(form.languages),
      experienceLevel: form.experienceLevel || undefined,
      screeningQuestions: form.screeningQuestions,

      // schema expects nested range + Date for deadline
      startDateRange: {
        from: form.startDateFrom, // "YYYY-MM-DD"
        to: form.startDateTo, // "YYYY-MM-DD"
      },
      applicationDeadline: form.applicationDeadline, // "YYYY-MM-DD"
    };
  };

  /* -------------------------------------------------------------- */
  /* Submit (Create / Update)                                       */
  /* -------------------------------------------------------------- */
  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);

    if (!validateAll()) {
      for (const st of [1, 2, 3]) {
        if (!validateStep(st)) {
          setCurrentStep(st);
          break;
        }
      }
      toast.error("Please complete the required fields before submitting.", { autoClose: 2500 });
      return;
    }

    const payload = buildPayload();
    const tid = toast.loading(isEdit ? "Saving changes…" : "Submitting job…");

    try {
      setSaving(true);

      let res, data;
      if (isEdit) {
        // PATCH to your update route
        res = await fetch(`${API_BASE}/api/company/jobs/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeader() },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to save changes");
      } else {
        // Create (controller should infer companyId & companyName from user)
        res = await fetch(`${API_BASE}/api/jobs`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader() },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to post job");
      }

      toast.update(tid, {
        render: isEdit ? "Changes saved." : "Job posted successfully!",
        type: "success",
        isLoading: false,
        autoClose: 2200,
        closeOnClick: true,
      });

      if (!isEdit) {
        setForm(EMPTY_FORM);
        setRespDraft("");
        setOfferDraft("");
        setReqDraft("");
        setScreenDraft("");
        setErrors({});
        onCreated?.(data?.job || data);
      }

      const saved = data?.job || data;
      const targetId = isEdit ? id : saved?._id || saved?.id;
      if (targetId) navigate(`/company/job/${encodeURIComponent(targetId)}`, { replace: true });
    } catch (err) {
      setMsg(`❌ ${err.message}`);
      toast.update(tid, {
        render: err.message || (isEdit ? "Failed to save changes" : "Failed to post job"),
        type: "error",
        isLoading: false,
        autoClose: 3500,
        closeOnClick: true,
      });
    } finally {
      setSaving(false);
    }
  }

  /* -------------------------------------------------------------- */
  /* Derived UI bits                                                */
  /* -------------------------------------------------------------- */
  const skillsPreview = useMemo(() => splitCSV(form.skills), [form.skills]);
  const languagesPreview = useMemo(() => splitCSV(form.languages), [form.languages]);

  const inputCls = (hasErr) =>
    `w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 ${
      hasErr ? "border-red-400" : "border-gray-200"
    }`;

  /* -------------------------------------------------------------- */
  /* Render                                                         */
  /* -------------------------------------------------------------- */
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-semibold mb-7">
        {isEdit ? "Edit Job Posting" : "Create New Job Posting"}
      </h2>

      {/* Stepper */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-6 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          {[
            { id: 1, label: "Basic Info" },
            { id: 2, label: "Description" },
            { id: 3, label: "Requirements" },
            { id: 4, label: isEdit ? "Review & Save" : "Review" },
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
                    currentStep === s.id ? "text-[#173B8A] font-medium" : "text-gray-600"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < arr.length - 1 && <div className="flex-1 mx-3 h-px bg-gray-200" />}
            </div>
          ))}
        </div>
      </div>

      {/* Steps 1–3 */}
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
                    onChange={(e) => setField("title", e.target.value)}
                    placeholder="e.g., Junior Frontend Engineer"
                  />
                </Field>

                <Field label="Job Category" error={errors.department} required>
                  <select
                    className={inputCls(!!errors.department)}
                    value={form.department}
                    onChange={(e) => setField("department", e.target.value)}
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
                        onChange={(e) => setField("otherDepartment", e.target.value)}
                        autoFocus
                      />
                      {errors.otherDepartment && (
                        <div className="mt-1 text-xs text-red-600">{errors.otherDepartment}</div>
                      )}
                    </div>
                  )}
                </Field>

                <Field label="Location" error={errors.location} required>
                  <input
                    className={inputCls(!!errors.location)}
                    value={form.location}
                    onChange={(e) => setField("location", e.target.value)}
                    placeholder="e.g., San Fabian, Dagupan, Mangaldan"
                  />
                </Field>

                <Field label="Employment Type" error={errors.jobType} required>
                  <div className="flex flex-wrap gap-4">
                    {JOB_TYPES.map((opt) => (
                      <Radio
                        key={opt}
                        name="jobType"
                        label={opt}
                        checked={form.jobType === opt}
                        onChange={() => setField("jobType", opt)}
                      />
                    ))}
                  </div>
                </Field>

                <Field label="Monthly salary" error={errors.salaryMax} required>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {PESO}
                    </span>
                    <input
                      className={`${inputCls(!!errors.salaryMax)} pl-8`}
                      type="number"
                      min="0"
                      value={form.salaryMax}
                      onChange={(e) => setField("salaryMax", e.target.value)}
                      placeholder="e.g., 12000"
                    />
                  </div>
                </Field>

                <Field label="Work Type" error={errors.workType} required>
                  <div className="flex flex-wrap gap-4">
                    {WORK_TYPES.map((opt) => (
                      <Radio
                        key={opt}
                        name="workType"
                        label={opt}
                        checked={form.workType === opt}
                        onChange={() => setField("workType", opt)}
                      />
                    ))}
                  </div>
                </Field>

                <Field label="Start Date (From)" error={errors.startDateFrom} required>
                  <input
                    type="date"
                    className={inputCls(!!errors.startDateFrom)}
                    value={form.startDateFrom}
                    onChange={(e) => setField("startDateFrom", e.target.value)}
                  />
                </Field>

                <Field label="Start Date (To)" error={errors.startDateTo} required>
                  <input
                    type="date"
                    className={inputCls(!!errors.startDateTo)}
                    value={form.startDateTo}
                    onChange={(e) => setField("startDateTo", e.target.value)}
                    min={form.startDateFrom || undefined}
                  />
                </Field>

                <Field label="Application Deadline" error={errors.applicationDeadline} required>
                  <input
                    type="date"
                    className={inputCls(!!errors.applicationDeadline)}
                    value={form.applicationDeadline}
                    onChange={(e) => setField("applicationDeadline", e.target.value)}
                  />
                </Field>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <SectionTitle>Description</SectionTitle>

              <div className="space-y-6">
                <Field label="Job Description Details" error={errors.description} required>
                  <textarea
                    className={`${inputCls(!!errors.description)} min-h-[160px]`}
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder="Describe the role, impact, team, and tools…"
                  />
                </Field>

                <Field label="Responsibilities (list)" error={errors.responsibilities} required>
                  <ListEditor
                    draft={respDraft}
                    setDraft={setRespDraft}
                    onAdd={() => {
                      pushIfNotEmpty("responsibilities", respDraft);
                      setRespDraft("");
                    }}
                    items={form.responsibilities}
                    onRemove={(i) => removeAt("responsibilities", i)}
                    placeholder="e.g., Build UI, write tests"
                  />
                </Field>

                <Field label="What we offer (list)" error={errors.offers} required>
                  <ListEditor
                    draft={offerDraft}
                    setDraft={setOfferDraft}
                    onAdd={() => {
                      pushIfNotEmpty("offers", offerDraft);
                      setOfferDraft("");
                    }}
                    items={form.offers}
                    onRemove={(i) => removeAt("offers", i)}
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
                      onChange={(e) => setField("skills", e.target.value)}
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
                    <p className="text-xs text-gray-500">Tip: separate skills with commas.</p>
                  </div>
                </Field>

                <Field label="Education Level">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-4">
                      {EDUCATION_LEVELS_ROW1.map((lvl) => (
                        <Radio
                          key={lvl}
                          name="eduLvl"
                          label={lvl}
                          checked={form.educationLevel === lvl}
                          onChange={() => setField("educationLevel", lvl)}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {EDUCATION_LEVELS_ROW2.map((lvl) => (
                        <Radio
                          key={lvl}
                          name="eduLvl"
                          label={lvl}
                          checked={form.educationLevel === lvl}
                          onChange={() => setField("educationLevel", lvl)}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Optional.</p>
                </Field>

                <Field label="Languages (comma separated)">
                  <div className="space-y-2">
                    <input
                      className={inputCls(false)}
                      placeholder="e.g., English, Filipino"
                      value={form.languages}
                      onChange={(e) => setField("languages", e.target.value)}
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
                      label="Entry (0–2 yrs)"
                      checked={form.experienceLevel === "Entry"}
                      onChange={() => setField("experienceLevel", "Entry")}
                    />
                    <Radio
                      name="expLvl"
                      label="Mid (3–5 yrs)"
                      checked={form.experienceLevel === "Mid"}
                      onChange={() => setField("experienceLevel", "Mid")}
                    />
                    <Radio
                      name="expLvl"
                      label="Senior (6+ yrs)"
                      checked={form.experienceLevel === "Senior"}
                      onChange={() => setField("experienceLevel", "Senior")}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Optional.</p>
                </Field>

                <Field label="Screening Questions" error={errors.screeningQuestions}>
                  <ListEditor
                    draft={screenDraft}
                    setDraft={setScreenDraft}
                    onAdd={() => {
                      pushIfNotEmpty("screeningQuestions", screenDraft);
                      setScreenDraft("");
                    }}
                    items={form.screeningQuestions}
                    onRemove={(i) => removeAt("screeningQuestions", i)}
                    placeholder="e.g., Why this role? Paste your portfolio link."
                    error={errors.screeningQuestions}
                  />
                </Field>

                <Field label="Other requirements (list)" error={errors.requirements} required>
                  <ListEditor
                    draft={reqDraft}
                    setDraft={setReqDraft}
                    onAdd={() => {
                      pushIfNotEmpty("requirements", reqDraft);
                      setReqDraft("");
                    }}
                    items={form.requirements}
                    onRemove={(i) => removeAt("requirements", i)}
                    placeholder="e.g., 3rd year BSCS, basic Git"
                  />
                </Field>
              </div>
            </>
          )}

          {msg && <div className="mt-4 text-sm">{msg}</div>}
        </div>
      )}

      {/* Review & Submit */}
      {currentStep === 4 && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow border border-gray-200">
          {/* ===== Basic info FIRST (Job Title at the very top) ===== */}
          <div className="mb-6 rounded-xl border border-gray-200 p-5 bg-gray-50">
            <h2 className="text-2xl font-semibold text-gray-900">{form.title || "—"}</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-800">
              <Meta
                label="Department"
                value={form.department === "Other" ? form.otherDepartment || "—" : form.department || "—"}
              />
              <Meta label="Location" value={form.location} />
              <Meta label="Employment Type" value={form.jobType} />
              <Meta label="Salary (Max)" value={form.salaryMax ? `${PESO}${form.salaryMax}` : "—"} />
              <Meta label="Work Type" value={form.workType} />
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-800">
              <Meta label="Start Date (From)" value={fmtDatePretty(form.startDateFrom) || "—"} />
              <Meta label="Start Date (To)" value={fmtDatePretty(form.startDateTo) || "—"} />
              <Meta label="Application Deadline" value={fmtDatePretty(form.applicationDeadline) || "—"} />
            </div>
          </div>

          {/* ===== Description ===== */}
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Job Description</h3>
          <p className="text-sm leading-6 text-gray-800 mb-6 whitespace-pre-line">
            {form.description || "—"}
          </p>

          {/* ===== Key Responsibilities ===== */}
          <h4 className="text-base font-semibold text-gray-900 mb-2">Key Responsibilities</h4>
          {form.responsibilities.length ? (
            <ul className="list-disc pl-6 space-y-1 mb-6 text-sm text-gray-800">
              {form.responsibilities.map((x, i) => (
                <li key={`resp-r-${i}`}>{x}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 mb-6">—</p>
          )}

          {/* ===== What We Offer (now included in review) ===== */}
          <h4 className="text-base font-semibold text-gray-900 mb-2">What We Offer</h4>
          {form.offers.length ? (
            <ul className="list-disc pl-6 space-y-1 mb-6 text-sm text-gray-800">
              {form.offers.map((x, i) => (
                <li key={`offer-r-${i}`}>{x}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 mb-6">—</p>
          )}

          <hr className="my-6 border-gray-200" />

          {/* ===== Qualifications & Requirements ===== */}
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Qualifications & Requirements</h3>

          <h5 className="text-sm font-semibold text-gray-900 mb-2">Required Skills:</h5>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-800">
            <Meta label="Education Level" value={form.educationLevel || "—"} />
            <Meta label="Languages" value={languagesPreview.length ? languagesPreview.join(", ") : "—"} />
            <Meta
              label="Experience Level"
              value={
                form.experienceLevel === "Entry"
                  ? "Entry (0–2 yrs)"
                  : form.experienceLevel === "Mid"
                  ? "Mid (3–5 yrs)"
                  : form.experienceLevel === "Senior"
                  ? "Senior (6+ yrs)"
                  : "—"
              }
            />
          </div>

          <h5 className="text-sm font-semibold text-gray-900 mt-4 mb-2">Other Requirements:</h5>
          {form.requirements.length ? (
            <ul className="list-disc pl-6 space-y-1 mb-6 text-sm text-gray-800">
              {form.requirements.map((x, i) => (
                <li key={`req-r-${i}`}>{x}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 mb-6">—</p>
          )}

          <h5 className="text-sm font-semibold text-gray-900 mb-2">Screening Questions:</h5>
          {form.screeningQuestions.length ? (
            <ul className="list-disc pl-6 space-y-1 mb-6 text-sm text-gray-800">
              {form.screeningQuestions.map((x, i) => (
                <li key={`sq-r-${i}`}>{x}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 mb-6">—</p>
          )}

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-md bg-[#F37526] text-white disabled:opacity-60"
            >
              {saving ? (isEdit ? "Saving…" : "Submitting…") : isEdit ? "Save Changes" : "Submit Job"}
            </button>
          </div>

          {msg && <div className="mt-4 text-sm">{msg}</div>}
        </form>
      )}

      {/* Footer nav */}
      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
          className="px-4 py-2 rounded-md border bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
          disabled={currentStep === 1 || saving}
        >
          Previous
        </button>

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={() => {
              if (validateStep(currentStep)) setCurrentStep((s) => Math.min(4, s + 1));
              else toast.warn("Please finish the required fields in this step.", { autoClose: 2000 });
            }}
            className="px-4 py-2 rounded-md bg-orange-500 text-white hover:opacity-95 disabled:opacity-60"
            disabled={saving}
          >
            Next
          </button>
        ) : (
          <span className="text-sm text-gray-500">
            Ready? Click <span className="font-medium text-gray-700">{isEdit ? "Save Changes" : "Submit Job"}</span>.
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small presentational bits                                          */
/* ------------------------------------------------------------------ */
function SectionTitle({ children }) {
  return <h3 className="text-lg font-semibold text-gray-800 mb-4">{children}</h3>;
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

function ListEditor({ draft, setDraft, onAdd, items, onRemove, placeholder, error }) {
  return (
    <>
      <div className="flex gap-2">
        <input
          className={`w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 ${
            error ? "border-red-400" : "border-gray-200"
          }`}
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

function Meta({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value || "—"}</span>
    </div>
  );
}