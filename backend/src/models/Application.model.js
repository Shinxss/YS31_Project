// models/Application.model.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const applicationSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",     // ⬅️ was "Student_User"
      required: true,
    },
    job: {
      type: Schema.Types.ObjectId,
      ref: "Job",         // keep if your job model is model("Job", ...)
      required: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",    
    },
    companyName: String,
    status: {
      type: String,
      enum: ["Application Sent", "Under Review", "Accepted", "Rejected", "Withdrawn"],
      default: "Application Sent",
    },
    resume: String,
    message: String,
    answers: [
      {
        question: String,
        answer: String,
      },
    ],
    purpose: {
      type: String,
      trim: true,
      enum: [
        "Career Growth",
        "Skill Development",
        "Academic Requirement",
        "Financial Motivation",
        "Career Exploration",
        "Networking",
        "Personal Development",
        "Future Employment",
        "Other",
      ],
      required: true,
    },
    purposeDetail: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Application", applicationSchema);
