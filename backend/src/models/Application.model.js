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
      enum: ["New", "Under Review", "Accepted", "Rejected", "Withdrawn"],
      default: "New",
    },
    resume: String,
    message: String,
    answers: [
      {
        question: String,
        answer: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Application", applicationSchema);
