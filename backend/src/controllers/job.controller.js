// controllers/job.controller.js
import User from "../models/user.model.js";
import Company from "../models/company.model.js";
import Job from "../models/job.model.js";

const reqd = (v, name) => {
  if (v === undefined || v === null || (typeof v === "string" && !v.trim()))
    throw new Error(`${name} is required`);
};

const toList = (v) => {
  if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
  if (typeof v === "string")
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
};

// small helpers
const isObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(String(id));
const toDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(typeof val === "string" ? val : val);
  return isNaN(d.getTime()) ? null : d;
};

async function getCompanyForUser(userId) {
  const user = await User.findById(userId).lean();
  if (!user) throw new Error("Unauthorized");
  if (user.role !== "company") throw new Error("Forbidden: company only");

  const company =
    (await Company.findOne({ email: user.email }).lean()) ||
    (await Company.findOne({ userId: user._id }).lean());

  if (!company) throw new Error("Company profile not found");
  return company;
}

const PESO = "₱";

// POST /api/jobs
export const createJob = async (req, res) => {
  try {
    const company = await getCompanyForUser(req.user.id);

    const {
      title,
      workType,
      location,
      jobType, // e.g., Full-time / Part-time / Internship
      salaryMax,
      skills,
      description,
      requirements,
      responsibilities,
      offers,

      // required by your schema (based on earlier error)
      department,
      startDateRange,
      startDateFrom,
      startDateTo,
      applicationDeadline,
    } = req.body;

    // ✅ OPTIONAL: allow screening questions payload under various keys (added)
    const screeningQuestionsInput =
      req.body?.screeningQuestions ??
      req.body?.questions ??
      req.body?.screening?.questions ??
      req.body?.form?.screeningQuestions ??
      req.body?.form?.questions;

    // Required (presence)
    reqd(title, "title");
    reqd(workType, "workType");
    reqd(location, "location");
    reqd(jobType, "jobType");
    reqd(salaryMax, "salaryMax");
    reqd(description, "description");
    reqd(department, "department");

    const skillsArr = toList(skills);
    const reqArr = toList(requirements);
    const respArr = toList(responsibilities);
    const offersArr = toList(offers);
    // ✅ normalize screening questions to array of strings (added)
    const screeningArr = toList(screeningQuestionsInput).map((q) => String(q));

    if (!skillsArr.length) throw new Error("skills is required");
    if (!reqArr.length) throw new Error("requirements is required");
    if (!respArr.length) throw new Error("responsibilities is required");
    if (!offersArr.length) throw new Error("offers is required");

    const sMaxNum = Number(salaryMax);
    if (!Number.isFinite(sMaxNum) || sMaxNum < 0)
      throw new Error("salaryMax must be a number ≥ 0");

    const salaryMaxStored = `${PESO}${sMaxNum}`;
    const salaryMaxNumber = sMaxNum;

    // normalize dates
    const from =
      (startDateRange && toDate(startDateRange.from)) || toDate(startDateFrom);
    const to =
      (startDateRange && toDate(startDateRange.to)) || toDate(startDateTo);
    const deadline = toDate(applicationDeadline);

    if (!from || !to)
      throw new Error("startDateRange: startDateRange.from and .to are required");
    if (!deadline) throw new Error("applicationDeadline is required");

    const jobDoc = {
      companyId: company._id,
      companyName: company.companyName,
      title: String(title).trim(),
      department: String(department).trim(),
      workType,
      jobType,
      location: String(location).trim(),
      salaryMax: salaryMaxStored,
      salaryMaxNumber,
      description: String(description).trim(),
      skills: skillsArr,
      requirements: reqArr,
      responsibilities: respArr,
      offers: offersArr,
      startDateRange: { from, to },
      applicationDeadline: deadline,
      status: "open",
    };

    // ✅ only set if provided (keeps schema flexible) (added)
    if (screeningArr.length) {
      jobDoc.screeningQuestions = screeningArr;
    }

    const job = await Job.create(jobDoc);

    res.status(201).json({ message: "Job created", job });
  } catch (err) {
    console.error("createJob error:", err);
    res.status(400).json({ message: err.message || "Failed to create job" });
  }
};

// GET /api/jobs/mine
export const myJobs = async (req, res) => {
  try {
    const company = await getCompanyForUser(req.user.id);
    const jobs = await Job.find({ companyId: company._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ jobs });
  } catch (err) {
    console.error("myJobs error:", err);
    res.status(400).json({ message: err.message || "Server error" });
  }
};

// GET /api/jobs  (public list for students)
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: "open" })
      .sort({ createdAt: -1 })
      .select(
        "_id title companyName department location salaryMax workType jobType description skills startDateRange applicationDeadline createdAt"
      )
      .lean();

    res.json({ jobs });
  } catch (err) {
    console.error("getAllJobs error:", err);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

// ✅ GET /api/jobs/:id (public details)
export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) return res.status(404).json({ message: "Job not found" });

    const job = await Job.findById(id)
      .select(
        "_id title companyId companyName department location salaryMax salaryMaxNumber workType jobType description requirements responsibilities offers skills startDateRange applicationDeadline status createdAt screeningQuestions"
      )
      .lean();

    if (!job) return res.status(404).json({ message: "Job not found" });

    // Optionally include a bit of company info (safe fields only)
    let company = null;
    if (job.companyId) {
      company = await Company.findById(job.companyId)
        .select("_id companyName size industry")
        .lean();
    }

    res.json({ job, company });
  } catch (err) {
    console.error("getJobById error:", err);
    res.status(500).json({ message: "Failed to fetch job details" });
  }
};

// ✅ NEW: GET /api/jobs/:jobId/screening  (used by ApplyModal)
export const getScreeningQuestions = async (req, res) => {
  try {
    const { jobId } = req.params;
    if (!isObjectId(jobId)) return res.status(404).json({ message: "Job not found" });

    const job = await Job.findById(jobId).lean();
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Try multiple common fields/structures to be robust after refactors
    const pools = [
      job.screeningQuestions,
      job.questions,
      job?.screening?.questions,
      job?.form?.screeningQuestions,
      job?.form?.questions,
    ].filter(Boolean);

    let picked = [];
    for (const p of pools) {
      if (Array.isArray(p) && p.length) {
        picked = p;
        break;
      }
    }

    const questions = (picked || [])
      .map((q) => (typeof q === "string" ? q : q?.text || q?.question || ""))
      .filter(Boolean);

    return res.json({ questions });
  } catch (err) {
    console.error("getScreeningQuestions error:", err);
    return res
      .status(500)
      .json({ message: "Failed to load screening questions" });
  }
};
