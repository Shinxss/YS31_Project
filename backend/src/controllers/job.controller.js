import User from "../models/user.model.js";
import Company from "../models/company.model.js";
import Job from "../models/job.model.js";
import CompanyEmployees from "../models/companyEmployees.model.js"; // ✅ registered model

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
    } = req.body;

    // Required validations
    reqd(title, "title");
    reqd(workType, "workType");
    reqd(location, "location");
    reqd(jobType, "jobType");
    reqd(salaryMax, "salaryMax");
    reqd(description, "description");
    reqd(department, "department");

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
        throw new Error(`experienceLevel must be one of: ${expAllowed.join(", ")}`);
      expValue = experienceLevel;
    }

    // ✅ Embed company snapshot (no populate needed later)
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
    });

    res.status(201).json({ message: "Job created successfully", job });
  } catch (err) {
    console.error("createJob error:", err);
    res.status(400).json({ message: err.message || "Failed to create job" });
  }
};

/* ============================================================
   GET /api/jobs/mine — Get Jobs by Company
   ============================================================ */
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

/* ============================================================
   GET /api/jobs — Public list (students)
   ============================================================ */
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: "open" })
      .sort({ createdAt: -1 })
      .select(
        "title companyName department location salaryMax workType jobType description skills educationLevel languages experienceLevel screeningQuestions createdAt companySnapshot"
      )
      .lean();

    res.json({ jobs });
  } catch (err) {
    console.error("getAllJobs error:", err);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

