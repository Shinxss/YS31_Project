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
      jobType,           // NEW
      salaryMax,        // number or string
      skills,
      description,
      requirements,
      responsibilities,
      offers,
    } = req.body;

    // Required (presence)
    reqd(title, "title");
    reqd(workType, "workType");
    reqd(location, "location");
    reqd(jobType, "jobType");
    reqd(salaryMax, "salaryMax");
    reqd(description, "description");

    // Lists
    const skillsArr = toList(skills);
    const reqArr = toList(requirements);
    const respArr = toList(responsibilities);
    const offersArr = toList(offers);

    if (!skillsArr.length) throw new Error("skills is required");
    if (!reqArr.length) throw new Error("requirements is required");
    if (!respArr.length) throw new Error("responsibilities is required");
    if (!offersArr.length) throw new Error("offers is required");

    // Salary validation and formatting with peso sign
    const sMaxNum = Number(salaryMax);
    if (!Number.isFinite(sMaxNum) || sMaxNum < 0)
      throw new Error("salaryMax must be a number ≥ 0");

    // Save salary with peso sign (e.g., "₱50000")
    const salaryMaxStored = `${PESO}${sMaxNum}`;

    const job = await Job.create({
      companyId: company._id,
      companyName: company.companyName,
      title: String(title).trim(),
      workType,
      jobType, // NEW
      location: String(location).trim(),
      salaryMax: salaryMaxStored, // string with peso sign
      description: String(description).trim(),
      skills: skillsArr,
      requirements: reqArr,
      responsibilities: respArr,
      offers: offersArr,
      status: "open",
    });

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

// GET /api/jobs for students
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: "open" })
      .sort({ createdAt: -1 })
      .select(
        "title companyName location salaryMax workType jobType description skills createdAt"
      )
      .lean();

    res.json({ jobs });
  } catch (err) {
    console.error("getAllJobs error:", err);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};
