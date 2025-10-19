import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import multer from "multer";

import Application from "../models/Application.model.js";
import Job from "../models/job.model.js";
import Student from "../models/student.model.js";
import Company from "../models/company.model.js";

/* ----------------------------- Helpers ----------------------------- */

const isObjectId = (v) => mongoose.Types.ObjectId.isValid(String(v));

// Ensure uploads/resumes dir exists
const RESUMES_DIR = path.join(process.cwd(), "uploads", "resumes");
try {
  fs.mkdirSync(RESUMES_DIR, { recursive: true });
} catch { /* no-op */ }

/* ----------------------------- Multer ------------------------------ */

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, RESUMES_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, "_");
    const userId = req.user?.id || "anon";
    cb(null, `${userId}-${Date.now()}-${safe}`);
  },
});

// Accept PDF/DOC/DOCX up to 5MB (optional; relax if not needed)
const fileFilter = (_req, file, cb) => {
  const okMime = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);
  const okExt = /\.(pdf|docx?)$/i.test(file.originalname);
  if (okMime.has(file.mimetype) || okExt) return cb(null, true);
  return cb(new Error("Only PDF, DOC, or DOCX files are allowed"));
};

export const uploadResume = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("resume"); // <-- field name MUST be "resume"

/* -------------------------- Controllers ---------------------------- */

// GET /api/student/applications
export const listMyApplications = async (req, res) => {
  try {
    const uid = req.user?.id;
    const email = (req.user?.email || "").toLowerCase();

    // find the Student profile linked to this user
    const studentDoc =
      (uid ? await Student.findOne({ user: uid }) : null) ||
      (email ? await Student.findOne({ email }) : null);

    if (!studentDoc?._id) {
      // no student profile – return empty list so UI shows “no applications”
      return res.json({ applications: [] });
    }

    const apps = await Application.find({ student: studentDoc._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "job",
        select:
          "title companyName location department workType jobType applicationDeadline",
        model: Job,
      })
      .lean();

    res.json({ applications: apps });
  } catch (err) {
    console.error("listMyApplications error:", err);
    res.status(500).json({ message: "Failed to load applications" });
  }
};

// POST /api/student/apply/:jobId?   (also accepts jobId in body)
export const applyToJob = async (req, res) => {
  try {
    const jobId = req.params.jobId || req.body.jobId;
    const { message } = req.body;

    // 1) Find the Student profile for this logged-in user
    const uid = req.user?.id;
    const email = (req.user?.email || "").toLowerCase();
    const studentDoc =
      (uid ? await Student.findOne({ user: uid }) : null) ||
      (email ? await Student.findOne({ email }) : null);

    if (!studentDoc?._id) {
      return res.status(400).json({ message: "Student profile not found" });
    }

    // 2) Validate jobId and job
    if (!mongoose.Types.ObjectId.isValid(String(jobId))) {
      return res.status(400).json({ message: "Invalid jobId" });
    }
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // 3) Prevent duplicate applications (use Student _id)
    const existing = await Application.findOne({
      student: studentDoc._id,
      job: jobId,
    });
    if (existing) {
      return res.status(400).json({ message: "You already applied to this job" });
    }

    // 4) Parse answers (same as you have now) …
    let parsedAnswers = [];
    if (req.body.answers) {
      try {
        const raw =
          typeof req.body.answers === "string"
            ? JSON.parse(req.body.answers)
            : req.body.answers;
        if (Array.isArray(raw)) {
          parsedAnswers = raw.map((a, i) =>
            typeof a === "string"
              ? { question: `Q${i + 1}`, answer: a }
              : { question: a.question ?? `Q${i + 1}`, answer: a.answer ?? "" }
          );
        } else if (raw && typeof raw === "object") {
          parsedAnswers = Object.entries(raw).map(([k, v]) => ({
            question: `Q${Number(k) + 1}`,
            answer: String(v ?? ""),
          }));
        }
      } catch {}
    }

    // 5) Create Application with the **Student** _id
    const newApp = await Application.create({
      student: studentDoc._id,                    // ⬅️ key line
      job: job._id,
      company: job.companyId,
      companyName: job.companyName,
      resume: req.file ? req.file.filename : null,
      message: message || "",
      answers: parsedAnswers,
      status: "Application Sent",
    });

    return res.status(201).json({
      message: "Application submitted successfully!",
      application: newApp,
    });
  } catch (error) {
    console.error("❌ applyToJob Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/student/applications/stats
export const getStudentApplicationStats = async (req, res) => {
  try {
    const uid = req.user?.id;
    const email = (req.user?.email || "").toLowerCase();
    const studentDoc =
      (uid ? await Student.findOne({ user: uid }) : null) ||
      (email ? await Student.findOne({ email }) : null);

    if (!studentDoc?._id) {
      return res.json({ sent: 0, accepted: 0, rejected: 0, successRate: 0 });
    }

    const [total, accepted, rejected] = await Promise.all([
      Application.countDocuments({ student: studentDoc._id }),
      Application.countDocuments({ student: studentDoc._id, status: "Accepted" }),
      Application.countDocuments({ student: studentDoc._id, status: "Rejected" }),
    ]);

    const successRate = total ? Math.round((accepted / total) * 10000) / 100 : 0;
    return res.json({ sent: total, accepted, rejected, successRate });
  } catch (error) {
    console.error("getStudentApplicationStats error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const STATUS_MAP = new Map([
  ["application sent", "Application Sent"],
  ["new", "New"],
  ["under review", "Under Review"],
  ["under_review", "Under Review"],
  ["accepted", "Accepted"],
  ["rejected", "Rejected"],
  ["withdrawn", "Withdrawn"],
]);

function toCanonicalStatus(s) {
  if (!s) return null;
  const key = String(s).trim().toLowerCase();
  return STATUS_MAP.get(key) || null;
}

export async function updateApplicationStatus(req, res) {
  try {
    const { id } = req.params;
    const canonical = toCanonicalStatus(req.body?.status);

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid application id" });
    }
    if (!canonical) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // find company for the logged-in user (id first, fallback by email if you use that)
    const company = await Company
      .findOne({ user: req.user.id })
      .select("_id companyName");
    if (!company) {
      return res.status(403).json({ message: "No company profile for this user" });
    }

    // authorize + update in one go
    const app = await Application.findOneAndUpdate(
      {
        _id: id,
        $or: [
          { company: company._id },
          // supports old docs that only stored companyName
          ...(company.companyName ? [{ companyName: company.companyName }] : []),
        ],
      },
      { $set: { status: canonical } },
      { new: true, runValidators: true }
    );

    if (!app) {
      // either not found, or not owned by this company
      return res.status(404).json({ message: "Application not found" });
    }

    return res.json({ message: "Status updated", application: app });
  } catch (err) {
    console.error("updateApplicationStatus error:", err);
    return res.status(500).json({ message: "Failed to update status" });
  }
}