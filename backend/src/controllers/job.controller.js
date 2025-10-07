// backend/src/controllers/job.controller.js
import User from "../models/user.model.js";
import Company from "../models/company.model.js";
import Job from "../models/job.model.js";

const reqd = (v, name) => {
  if (v === undefined || v === null || (typeof v === "string" && !v.trim()))
    throw new Error(`${name} is required`);
};

const toList = (v) => {
  if (Array.isArray(v)) return v.map(s => String(s).trim()).filter(Boolean);
  if (typeof v === "string") return v.split(",").map(s => s.trim()).filter(Boolean);
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

// POST /api/jobs
export const createJob = async (req, res) => {
  try {
    const company = await getCompanyForUser(req.user.id);

    const {
      title,
      workType,
      location,
      durationMonths,
      salaryCurrency,
      salaryMax,
      startDate,
      applicationDeadline,
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
    reqd(durationMonths, "durationMonths");
    reqd(salaryCurrency, "salaryCurrency");
    reqd(salaryMax, "salaryMax");
    reqd(startDate, "startDate");
    reqd(applicationDeadline, "applicationDeadline");
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

    // Numbers
    const dur = Number(durationMonths);
    const sMax = Number(salaryMax);
    if (!Number.isFinite(dur) || dur <= 0) throw new Error("durationMonths must be a positive number");
    if (!Number.isFinite(sMax) || sMax <= 0) throw new Error("salaryMax must be a positive number");

    // Dates
    const sd = new Date(startDate);
    const ad = new Date(applicationDeadline);
    if (isNaN(sd.getTime())) throw new Error("startDate is invalid");
    if (isNaN(ad.getTime())) throw new Error("applicationDeadline is invalid");
    // If you want to enforce deadline <= start date, uncomment next line:
    // if (ad > sd) throw new Error("applicationDeadline must be on/before startDate");

    const job = await Job.create({
      companyId: company._id,
      companyName: company.companyName,
      title: String(title).trim(),
      workType,
      location: String(location).trim(),
      durationMonths: dur,
      salaryCurrency,
      salaryMax: sMax,
      startDate: sd,
      applicationDeadline: ad,
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
