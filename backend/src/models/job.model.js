import mongoose from "mongoose";

const pesoify = (v) => {
  if (v === null || v === undefined || v === "") return v;
  const n = Number(typeof v === "string" ? v.replace(/[^\d.]/g, "") : v);
  if (!Number.isFinite(n) || n < 0) return "₱0";
  return `₱${n}`;
};

/** Embedded snapshot of the company at the time of posting (no populate needed) */
const CompanySnapshotSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "CompanyEmployees" },
    companyName: String,
    profileImage: String, // e.g. "1760450331933.jpeg" or full URL
    coverPhoto: String,
    address: String,
    city: String,
    province: String,
    industry: String,
    website: String,
    companySize: String,
    email: String,
  },
  { _id: false }
);

/** ✅ Subschema for start date window (range) */
const StartDateRangeSchema = new mongoose.Schema(
  {
    from: { type: Date, required: true },
    to: { type: Date, required: true },
  },
  { _id: false }
);

const JobSchema = new mongoose.Schema(
  {
    /** Main pointer to company_employees / CompanyEmployees model */
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyEmployees",
      required: true,
      index: true,
    },

    companyName: { type: String, required: true },

    title: { type: String, required: true, trim: true },

    // e.g., On-site | Hybrid | Remote
    workType: {
      type: String,
      enum: ["On-site", "Hybrid", "Remote"],
      required: true,
      default: "On-site",
    },

    // e.g., Full-time | Intern | Part-time | Contract
    jobType: {
      type: String,
      enum: ["Full-time", "Intern", "Part-time", "Contract"],
      required: true,
    },

    // Department saved from UI (Engineering, IT, Operations, etc.)
    department: { type: String, required: true, trim: true },

    location: { type: String, required: true, trim: true },

    // Store salary with peso sign (e.g., "₱50000")
    salaryMax: {
      type: String,
      required: true,
      set: pesoify,
    },

    description: { type: String, required: true, trim: true },

    // Lists (must have at least one item)
    skills: {
      type: [{ type: String, trim: true, required: true }],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "skills must have at least one item",
      },
    },
    requirements: {
      type: [{ type: String, trim: true, required: true }],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "requirements must have at least one item",
      },
    },
    responsibilities: {
      type: [{ type: String, trim: true, required: true }],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "responsibilities must have at least one item",
      },
    },
    offers: {
      type: [{ type: String, trim: true, required: true }],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "offers must have at least one item",
      },
    },

    // Optional arrays/fields from UI
    educationLevel: [{ type: String, trim: true }],
    languages: [{ type: String, trim: true }],
    experienceLevel: {
      type: String,
      enum: ["Entry", "Mid", "Senior"],
      default: undefined,
    },
    screeningQuestions: [{ type: String, trim: true }],

    /** ✅ Embedded company snapshot (so FE can show logo without populate) */
    companySnapshot: { type: CompanySnapshotSchema, default: undefined },

    status: {
      type: String,
       enum: ["open", "pending", "closed","archived", "deleted", "suspended"],
      default: "open",
      index: true,
    },

    // ✅ Start date window (range) as a subschema
    startDateRange: {
      type: StartDateRangeSchema,
      required: true,
    },

    // ✅ Application deadline
    applicationDeadline: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

// Helpful for company listings
JobSchema.index({ companyId: 1, createdAt: -1 });

// ✅ Helpful for filtering and sorting by timeline on the student side
JobSchema.index({ status: 1, applicationDeadline: 1 });
JobSchema.index({ "startDateRange.from": 1, "startDateRange.to": 1 });

/** ✅ Enforce from ≤ to via schema hook (avoids invalid inline path validators) */
JobSchema.pre("validate", function (next) {
  const v = this.startDateRange;
  if (!v || !v.from || !v.to) {
    this.invalidate("startDateRange", "startDateRange.from and .to are required");
    return next();
  }
  if (v.from.getTime() > v.to.getTime()) {
    this.invalidate(
      "startDateRange",
      "startDateRange.from must be earlier than or equal to startDateRange.to"
    );
  }
  next();
});

export default mongoose.model("Job", JobSchema);
