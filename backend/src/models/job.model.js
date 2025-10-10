// backend/src/models/job.model.js
import mongoose from "mongoose";

const pesoify = (v) => {
  // Accept numbers or strings; always store as "₱<number>"
  if (v === null || v === undefined || v === "") return v;
  const n = Number(
    typeof v === "string" ? v.replace(/[^\d.]/g, "") : v
  );
  if (!Number.isFinite(n) || n < 0) return "₱0";
  return `₱${n}`;
};

const JobSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
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

    status: { type: String, enum: ["open", "closed"], default: "open", index: true },
  },
  { timestamps: true }
);

// Helpful for company listings
JobSchema.index({ companyId: 1, createdAt: -1 });

export default mongoose.model("Job", JobSchema);
