import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student_User",
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company_User",
    },
    companyName: String,
    status: {
      type: String,
      enum: ["Applied", "Accepted", "Rejected"],
      default: "Applied",
    },
    resume: String, // ✅ store uploaded filename or path
    message: String, // ✅ student’s short message
    answers: [
      {
        question: String,
        answer: String,
      },
    ], // ✅ screening answers
  },
  { timestamps: true }
);


export default mongoose.model("Application", applicationSchema);
