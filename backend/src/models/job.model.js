// backend/src/models/job.model.js
import mongoose from "mongoose";

const JobSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    companyName: { type: String, required: true },

    title: { type: String, required: true, trim: true },

    // salary range is optional but structured
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    salaryCurrency: { type: String, default: "PHP" },

    startDate: { type: Date },               // optional
    durationMonths: { type: Number },        // optional

    location: { type: String, default: "" }, // optional
    workType: { type: String, enum: ["On-site", "Hybrid", "Remote"], default: "On-site" },

    description: { type: String, default: "" },
    tags: [{ type: String, trim: true }],
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

export default mongoose.model("Job", JobSchema);
