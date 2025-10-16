import User from "../../models/user.model.js";
import Company from "../../models/company/company.model.js";
import Job from "../../models/company/job.model.js";
import CompanyEmployees from "../../models/company/companyEmployees.model.js";

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

// ✅ Helper: parse and validate date-like input
const asDate = (v, name) => {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new Error(`${name} must be a valid date`);
  return d;
};

// ✅ Helper: find the company profile for the logged-in user
async function getCompanyForUser(userId) {
  const user = await User.findById(userId).lean();
  if (!user) throw new Error("Unauthorized");
  if (user.role !== "company") throw new Error("Forbidden: company only");

  const companyProfile =
    (await CompanyEmployees.findOne({ "owner.userId": user._id }).lean()) ||
    (await CompanyEmployees.findOne({ "owner.email": user.email }).lean());

  if (!companyProfile)
    throw new Error("Company profile not found. Please complete company setup.");

  return companyProfile;
}

const PESO = "₱";

/* ============================================================
   POST /api/jobs — Create Job Posting
   ============================================================ */
export const createJob = async (req, res) => {
  try {
    const companyProfile = await getCompanyForUser(req.user.id);

    const {
      title,
      workType,
      location,
      jobType,
      salaryMax,
      skills,
      description,
      requirements,
      responsibilities,
      offers,
      department,
      educationLevel,
      languages,
      experienceLevel,
      screeningQuestions,

      // ✅ NEW: dates
      startDateFrom,          // e.g. "2025-11-01"
      startDateTo,            // e.g. "2026-01-31"
      applicationDeadline,    // e.g. "2025-10-31"
    } = req.body;

    // Required validations
    reqd(title, "title");
    reqd(workType, "workType");
    reqd(location, "location");
    reqd(jobType, "jobType");
    reqd(salaryMax, "salaryMax");
    reqd(description, "description");
    reqd(department, "department");

    // ✅ NEW: date validations (start range + application deadline)
    reqd(startDateFrom, "startDateFrom");
    reqd(startDateTo, "startDateTo");
    reqd(applicationDeadline, "applicationDeadline");

    const startFromDate = asDate(startDateFrom, "startDateFrom");
    const startToDate = asDate(startDateTo, "startDateTo");
    const deadlineDate = asDate(applicationDeadline, "applicationDeadline");

    if (startFromDate > startToDate) {
      throw new Error("startDateFrom must be earlier than or equal to startDateTo");
    }
    // Optional sanity check: deadline should not be after the start window ends
    // (comment this out if you don't want the constraint)
    // if (deadlineDate > startToDate) {
    //   throw new Error("applicationDeadline must be on or before the last possible start date");
    // }

    // Arrays
    const skillsArr = toList(skills);
    const reqArr = toList(requirements);
    const respArr = toList(responsibilities);
    const offersArr = toList(offers);
    if (!skillsArr.length) throw new Error("skills is required");
    if (!reqArr.length) throw new Error("requirements is required");
    if (!respArr.length) throw new Error("responsibilities is required");
    if (!offersArr.length) throw new Error("offers is required");

    const eduArr = toList(educationLevel);
    const langArr = toList(languages);
    const screenArr = toList(screeningQuestions);

    // Salary validation
    const sMaxNum = Number(salaryMax);
    if (!Number.isFinite(sMaxNum) || sMaxNum < 0)
      throw new Error("salaryMax must be a number ≥ 0");
    const salaryMaxStored = `${PESO}${sMaxNum}`;

    // Experience validation (optional)
    const expAllowed = ["Entry", "Mid", "Senior"];
    let expValue = undefined;
    if (typeof experienceLevel === "string" && experienceLevel.trim()) {
      if (!expAllowed.includes(experienceLevel))
        throw new Error(
          `experienceLevel must be one of: ${expAllowed.join(", ")}`
        );
      expValue = experienceLevel;
    }

  
    const companySnapshot = {
      companyId: companyProfile._id,
      companyName: companyProfile.companyName,
      profileImage: companyProfile.profileImage || "",
      coverPhoto: companyProfile.coverPhoto || "",
      city: companyProfile.city || "",
      province: companyProfile.province || "",
      industry: companyProfile.industry || "",
      website: companyProfile.website || "",
    };

    // ✅ Save new job document
    const job = await Job.create({
      companyId: companyProfile._id,
      companyName: companyProfile.companyName,
      title: String(title).trim(),
      department: String(department).trim(),
      workType,
      jobType,
      location: String(location).trim(),
      salaryMax: salaryMaxStored,
      description: String(description).trim(),
      skills: skillsArr,
      requirements: reqArr,
      responsibilities: respArr,
      offers: offersArr,
      educationLevel: eduArr,
      languages: langArr,
      experienceLevel: expValue,
      screeningQuestions: screenArr,
      status: "open",
      companySnapshot, // ✅ embedded snapshot here

      // ✅ NEW: persist dates
      startDateRange: {
        from: startFromDate,
        to: startToDate,
      },
      applicationDeadline: deadlineDate,
    });

    res.status(201).json({ message: "Job created successfully", job });
  } catch (err) {
    console.error("createJob error:", err);
    res
      .status(400)
      .json({ message: err.message || "Failed to create job" });
  }
};

export const myJobs = async (req, res) => {
  try {
    const companyProfile = await getCompanyForUser(req.user.id);

    const jobs = await Job.find({
      companyId: companyProfile._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ jobs });
  } catch (err) {
    console.error("myJobs error:", err);
    res.status(400).json({ message: err.message || "Server error" });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: "open" })
      .sort({ createdAt: -1 })
      .select(
        "title companyName department location salaryMax workType jobType description skills educationLevel languages experienceLevel screeningQuestions createdAt companySnapshot startDateRange applicationDeadline" // ✅ added
      )
      .lean();

    res.json({ jobs });
  } catch (err) {
    console.error("getAllJobs error:", err);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

/* ============================================================
   GET /api/jobs/:jobId — Get Job by ID
   ============================================================ */
export const getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId.match(/^[0-9a-fA-F]{24}$/))
      return res.status(400).json({ message: "Invalid Job ID format" });

    const job = await Job.findById(jobId)
      .populate({
        path: "companyId",
        select:
          "companyName profileImage coverPhoto city province rating industry",
        model: "CompanyEmployees",
      })
      .lean();

    if (!job) return res.status(404).json({ message: "Job not found" });

    res.status(200).json({ job });
  } catch (error) {
    console.error("❌ getJobById error:", error);
    res
      .status(500)
      .json({
        message: error.message || "Server error while fetching job details",
      });
  }
};

export const getScreeningQuestions = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json({ questions: job.screeningQuestions || [] });
  } catch (err) {
    console.error("getScreeningQuestions error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
