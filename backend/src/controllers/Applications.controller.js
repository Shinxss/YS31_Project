
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import multer from "multer";

import Application from "../models/Application.model.js";
import Job from "../models/job.model.js";
import Student from "../models/student.model.js";
import Company from "../models/company.model.js";
import Notification from "../models/Notification.js";   // ⬅️ new
import { sendPlainEmail } from "../utils/mailer.js";

/* ----------------------------- Helpers ----------------------------- */

const isObjectId = (v) => mongoose.Types.ObjectId.isValid(String(v));

// Ensure uploads/resumes dir exists
const RESUMES_DIR = path.join(process.cwd(), "uploads", "resumes");
try {
  fs.mkdirSync(RESUMES_DIR, { recursive: true });
} catch { /* no-op */ }

function getStudentDisplayName(s = {}, fallbackEmail = "") {
  return (
    s.fullname ||
    s.fullName ||
    s.name ||
    (s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : null) ||
    s.firstName ||
    s.lastName ||
    (fallbackEmail ? fallbackEmail.split("@")[0] : null) ||
    "Applicant"
  );
}

const PURPOSE_ALLOWED = new Set([
      "Career Growth",
      "Skill Development",
      "Academic Requirement",
      "Financial Motivation",
      "Career Exploration",
      "Networking",
      "Personal Development",
      "Future Employment",
      "Other",
    ]);

    function normalizePurposeFields(reqBody = {}) {
      const raw = String(reqBody.purpose || "").trim();
      const rawDetail = String(reqBody.purposeDetail || "").trim();
      const purpose = PURPOSE_ALLOWED.has(raw) ? raw : "";
      const purposeDetail = purpose === "Other" ? rawDetail : "";
      return { purpose, purposeDetail };
    }
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
    const { purpose, purposeDetail } = normalizePurposeFields(req.body);
    if (!purpose) return res.status(400).json({ message: "Purpose is required." });
    if (purpose === "Other" && !purposeDetail) {
      return res.status(400).json({ message: "Please specify your purpose." });
    }

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
    // if you need company details later, prefer lean()
    const job = await Job.findById(jobId).lean();
    if (!job) return res.status(404).json({ message: "Job not found" });

    // 3) Prevent duplicate applications (use Student _id)
    const existing = await Application.findOne({
      student: studentDoc._id,
      job: jobId,
    });
    if (existing) {
      return res.status(400).json({ message: "You already applied to this job" });
    }

    // 4) Parse answers (same logic as before)
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
      student: studentDoc._id,
      job: jobId,
      company: job.companyId,
      companyName: job.companyName,
      resume: req.file ? req.file.filename : null,
      message: message || "",
      answers: parsedAnswers,
      status: "Application Sent",
      purpose,          // NEW
      purposeDetail,
    });
    // 6) Server-side: create a company notification + send email (best practice)
    (async () => {
      try {
        // Resolve company email (by id first, then by name fallback)
        let companyEmail = null;
        if (job.companyId && mongoose.isValidObjectId(job.companyId)) {
          const comp = await Company.findById(job.companyId)
            .select("email contactEmail companyName")
            .lean();
          companyEmail = comp?.email || comp?.contactEmail || null;
        }
        if (!companyEmail && job.companyName) {
          const compByName = await Company.findOne({ companyName: job.companyName })
            .select("email contactEmail")
            .lean();
          companyEmail = compByName?.email || compByName?.contactEmail || null;
        }

        const applicantName  = getStudentDisplayName(studentDoc, email);
        const applicantEmail = (studentDoc?.email || email || "").toLowerCase();

        const jobTitle = job.title || job.jobTitle || "Untitled Role";
        const companyName = job.companyName || "Unknown Company";

        // Create company-side notification
        await Notification.create({
          title: `New applicant — ${applicantName} for ${jobTitle}`,
          body: `Heads up, ${applicantName} applied for ${jobTitle}`,
          type: "application",
          status: "Applied",
          companyId: job.companyId || undefined,
          recipientEmail: companyEmail || undefined,
          createdBy: studentDoc._id, // student who applied
          data: {
            jobId,
            jobTitle,
            companyName,
            companyEmail,
            applicantId: studentDoc._id,
            applicantName,
            applicantEmail,
            message: message || "",
            appliedAt: new Date(),
            purpose,         // NEW 
            purposeDetail,
          },
        });

        // Optional email to company
        if (companyEmail) {
            try {
              const mailRes = await sendPlainEmail({
                to: companyEmail,
                subject: `New applicant — ${applicantName} for ${jobTitle}`,
                text: `Heads up, ${applicantName} applied for ${jobTitle}`,
              });
              console.log("📧 Company email result:", mailRes);
            } catch (e) {
              console.warn("📧 Company email failed:", e.message);
            }
          } else {
            console.warn("📧 No company email found; skipping email send.", {
              jobId: String(jobId),
              companyId: job.companyId || null,
              companyName,
            });
          }
      } catch (notifyErr) {
        console.warn(
          "Application saved, but notification/email failed:",
          notifyErr?.message || notifyErr
        );
        // do not throw; we already created the application
      }
    })();

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
  ["new", "New"],
  ["under review", "Under Review"],
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

    // Ensure the caller is a company user
    const company = await Company
      .findOne({ user: req.user.id })
      .select("_id companyName email contactEmail")
      .lean();
    if (!company) {
      return res.status(403).json({ message: "No company profile for this user" });
    }

    // Update the application (and ensure it's theirs)
    const app = await Application.findOneAndUpdate(
      {
        _id: id,
        $or: [
          { company: company._id },
          ...(company.companyName ? [{ companyName: company.companyName }] : []),
        ],
      },
      { $set: { status: canonical } },
      { new: true, runValidators: true }
    ).lean();

    if (!app) {
      return res.status(404).json({ message: "Application not found" });
    }

    // ---- Build & send student notification + email (best-effort; non-blocking) ----
    (async () => {
      try {
        const [student, job] = await Promise.all([
          Student.findById(app.student)
            .select("email fullname fullName name firstName lastName")
            .lean(),
          Job.findById(app.job).select("title companyName companyId").lean(),
        ]);

        const studentEmail = (student?.email || "").toLowerCase();
        const applicantName = getStudentDisplayName(student || {}, studentEmail);
        const jobTitle = job?.title || "the position";
        const companyName = job?.companyName || company.companyName || "the company";

        // resolve a company contact email for the 'accepted' template
        const companyEmail =
          company?.email || company?.contactEmail || null;

        // Email body templates (exact text you provided)
        const acceptedBody =
`Hi ${applicantName},
your application for ${jobTitle} at ${companyName} has been accepted.
Contact us at ${companyEmail || "(no-reply)"} for more details.
— ${companyName}`;

        const rejectedBody =
`Hi ${applicantName},
your application for ${jobTitle} at ${companyName} has been rejected.
— ${companyName}`;

        const bodyText = canonical === "Accepted" ? acceptedBody : rejectedBody;

        // Create a Notification targeted to the student
        await Notification.create({
          title: `Application ${canonical} — ${jobTitle}`,
          body: bodyText,
          type: "status",
          status: canonical,
          companyId: company?._id || undefined,
          recipientEmail: studentEmail || undefined,
          createdBy: req.user?.id, // company user
          data: {
            jobId: job?._id,
            jobTitle,
            companyName,
            companyEmail,
            studentId: student?._id,
            applicantName,
            applicantEmail: studentEmail,
            status: canonical,
          },
        });

        // Send the email (if we have the student's email)
        if (studentEmail) {
          try {
            await sendPlainEmail({
              to: studentEmail,
              subject: `Your application was ${canonical} — ${jobTitle}`,
              text: bodyText,
            });
          } catch (e) {
            console.warn("Student email send failed:", e?.message || e);
          }
        }
      } catch (notifyErr) {
        console.warn("Student notification/email failed:", notifyErr?.message || notifyErr);
      }
    })();

    return res.json({ message: "Status updated", application: app });
  } catch (err) {
    console.error("updateApplicationStatus error:", err);
    return res.status(500).json({ message: "Failed to update status" });
  }
}

export async function deleteMyApplication(req, res) {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ message: "Invalid application id" });
    }

    // identify the student profile tied to this session
    const uid = req.user?.id;
    const email = (req.user?.email || "").toLowerCase();
    const studentDoc =
      (uid ? await Student.findOne({ user: uid }) : null) ||
      (email ? await Student.findOne({ email }) : null);

    if (!studentDoc?._id) {
      return res.status(400).json({ message: "Student profile not found" });
    }

    const app = await Application.findOne({ _id: id, student: studentDoc._id });
    if (!app) return res.status(404).json({ message: "Application not found" });

    // Only allow delete if it's still "Application Sent"
    if (app.status !== "Application Sent") {
      return res
        .status(409)
        .json({ message: `Cannot cancel when status is "${app.status}".` });
    }

    await Application.deleteOne({ _id: app._id });
    return res.json({ ok: true, deletedId: app._id });
  } catch (err) {
    console.error("deleteMyApplication error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}


export async function getScreeningAnswers(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid application id" });
    }
    const app = await Application.findById(id).select("answers").lean();
    if (!app) return res.status(404).json({ message: "Application not found" });
    return res.json(Array.isArray(app.answers) ? app.answers : []);
  } catch (err) {
    console.error("getScreeningAnswers error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getApplicantMessage(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid application id" });
    }
    const app = await Application.findById(id).select("message").lean();
    if (!app) return res.status(404).json({ message: "Application not found" });
    return res.json({ text: app.message || "" });
  } catch (err) {
    console.error("getApplicantMessage error:", err);
    res.status(500).json({ message: "Server error" });
  }
}


//----------------NEW-----------------------

export async function getApplicationCounts(req, res) {
  try {
    const { companyId, jobId, studentId } = req.query;

    // Build optional filters
    const match = {};
    if (companyId) match.company = companyId;
    if (jobId) match.job = jobId;
    if (studentId) match.student = studentId;

    // Aggregate per-status counts (case-insensitive)
    const grouped = await Application.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $cond: [
              { $or: [{ $eq: ["$status", null] }, { $eq: ["$status", ""] }] },
              "unknown",
              { $toLower: "$status" },
            ],
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const byStatus = grouped.map((g) => ({
      status: g._id,
      count: g.count,
    }));

    const totalApplications =
      byStatus.reduce((acc, x) => acc + x.count, 0) || 0;

    // Also return a convenient object map
    const statuses = byStatus.reduce((acc, x) => {
      acc[x.status] = x.count;
      return acc;
    }, {});

    return res.json({
      totalApplications,
      statuses, // e.g., { accepted: 10, rejected: 5, pending: 7 }
      byStatus, // array form if you prefer for charts
    });
  } catch (err) {
    console.error("getApplicationCounts error:", err);
    return res
      .status(500)
      .json({ message: "Failed to compute application counts" });
  }
}

//--------------NEW--------------

export async function getApplicationsSuccessRate(req, res) {
  try {
    const [total, accepted] = await Promise.all([
      Application.countDocuments({}),                                  // all applications
      Application.countDocuments({ status: /^(accepted|hired)$/i }),   // success statuses
    ]);

    const successRate = total ? Math.round((accepted / total) * 100) : 0;

    return res.json({ accepted, total, successRate });
  } catch (err) {
    console.error("success-rate error:", err);
    return res.status(500).json({ message: "Failed to compute success rate" });
  }
}
