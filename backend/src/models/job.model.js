import mongoose from "mongoose";

const JobSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    companyName: { type: String, required: true },

    title: { type: String, required: true, trim: true },

    // salary (max only, currency required)
    salaryCurrency: { type: String, default: "PHP", required: true },
    salaryMax: { type: Number, required: true, min: 1 },

    startDate: { type: Date, required: true },
    applicationDeadline: { type: Date, required: true },

    durationMonths: { type: Number, required: true, min: 1 },

    location: { type: String, required: true, trim: true },
    workType: { type: String, enum: ["On-site", "Hybrid", "Remote"], required: true, default: "On-site" },

    description: { type: String, required: true, trim: true },

    // NEW arrays (each must have >= 1 element)
    skills: [{ type: String, trim: true, required: true }],
    requirements: [{ type: String, trim: true, required: true }],
    responsibilities: [{ type: String, trim: true, required: true }],
    offers: [{ type: String, trim: true, required: true }],

    status: { type: String, enum: ["open", "closed"], default: "open", index: true },
  },
  { timestamps: true }
);

// Helpful for company listings
JobSchema.index({ companyId: 1, createdAt: -1 });

export default mongoose.model("Job", JobSchema);
