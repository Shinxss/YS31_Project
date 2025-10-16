import Application from "../models/Application.model.js";
import Job from "../models/job.model.js";
import multer from "multer";
import path from "path";

// ✅ Multer setup for resume upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/resumes");
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + file.originalname;
    cb(null, unique);
  },
});
export const uploadResume = multer({ storage }).single("resume");

// ✅ Apply with Final Details
export const applyToJob = async (req, res) => {
  try {
    const { jobId, message, answers } = req.body;
    const studentId = req.user.id;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const existing = await Application.findOne({ student: studentId, job: jobId });
    if (existing)
      return res.status(400).json({ message: "You already applied to this job" });

    const newApp = await Application.create({
      student: studentId,
      job: job._id,
      company: job.companyId,
      companyName: job.companyName,
      resume: req.file ? req.file.filename : null,
      message,
      answers: JSON.parse(answers || "[]"),
      status: "Applied",
    });

    res.status(201).json({
      message: "Application submitted successfully!",
      application: newApp,
    });
  } catch (error) {
    console.error("❌ applyToJob Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
