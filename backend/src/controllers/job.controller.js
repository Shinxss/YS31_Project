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

      // additional optional fields
      educationLevel,
      languages,
      experienceLevel,
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
    companyEmployeeId: req.user.id,  // Add this field to associate the employee
  };

    // ✅ only set if provided (keeps schema flexible) (added)
    if (screeningArr.length) {
      jobDoc.screeningQuestions = screeningArr;
    }

    // Add optional fields if provided
    if (educationLevel) {
      jobDoc.educationLevel = toList(educationLevel);
    }
    if (languages) {
      jobDoc.languages = toList(languages);
    }
    if (experienceLevel) {
      jobDoc.experienceLevel = String(experienceLevel).trim();
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
    const company = await getCompanyForUser(req.user.id); // Get the company for the logged-in user

    const jobs = await Job.find({ companyId: company._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "companyId",  // Populate company information
        select: "companyName profileImage city rating",  // Select fields to return
      })
      .populate({
        path: "companyEmployees",  // Populate company employees information
        select: "firstName lastName role email",  // Add fields as needed
      })
      .lean();

    res.json({ jobs });
  } catch (err) {
    console.error("myJobs error:", err);
    res.status(400).json({ message: err.message || "Server error" });
  }
}

// GET /api/jobs  (public list for students)
export const getAllJobs = async (req, res) => {
  try {
    // Use aggregation to populate company information
    const jobs = await Job.aggregate([
      {
        $match: { status: "open" }
      },
      {
        $lookup: {
          from: "company_employees",
          let: { companyName: "$companyName" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $toLower: "$companyName" },
                    { $toLower: "$$companyName" }
                  ]
                }
              }
            }
          ],
          as: "companyInfo"
        }
      },
      {
        $addFields: {
          company: {
            $cond: {
              if: { $gt: [{ $size: "$companyInfo" }, 0] },
              then: { $arrayElemAt: ["$companyInfo", 0] },
              else: null
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          companyName: 1,
          companyId: 1,
          department: 1,
          location: 1,
          salaryMax: 1,
          workType: 1,
          jobType: 1,
          description: 1,
          skills: 1,
          startDateRange: 1,
          applicationDeadline: 1,
          createdAt: 1,
          "companyProfile": {
            industry: "$company.industry",
            description: "$company.description",
            city: "$company.city",
            profileImage: "$company.profileImage",
            website: "$company.website",
            companySize: "$company.companySize",
            rating: { $ifNull: ["$company.rating", 4.5] }
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

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

    if (!job) return res.status(404).json({ message: "Job not found" });

    // Get company profile information
    let company = null;
    if (job.companyName) {
      const CompanyEmployees = (await import("../models/companyEmployees.model.js")).default;
      company = await CompanyEmployees.findOne({ companyName: job.companyName }).lean();
    }

    res.json({ job, company });
  } catch (err) {
    console.error("getJobById error:", err);
    res.status(500).json({ message: "Failed to fetch job details" });
  }
};

// GET /api/jobs/:id/applications - Get applications for a job
export const getJobApplications = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) return res.status(404).json({ message: "Job not found" });

    const Application = (await import("../models/Application.model.js")).default;
    const Student = (await import("../models/student.model.js")).default;

    const applications = await Application.find({ job: id })
      .populate({
        path: "student",
        select: "firstName lastName email profilePicture course school",
        model: "Student"
      })
      .lean();

    res.json({ applications });
  } catch (err) {
    console.error("getJobApplications error:", err);
    res.status(500).json({ message: "Failed to fetch applications" });
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

const PUBLIC_BASE = (process.env.SERVER_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/+$/,"");

const toCompanyImageUrl = (raw) => {
  if (!raw) return "";
  const v = String(raw).trim();
  if (/^https?:\/\//i.test(v)) return v;
  return `${PUBLIC_BASE}/uploads/company/${encodeURIComponent(v.replace(/^\/+/, ""))}`;
};

export async function listJobs(req, res) {
  try {
    const jobs = await Job.find({})
      .sort({ createdAt: -1 })
      .populate({
        path: "companyId",  // Populate company information
        select: "companyName profileImage city rating", // Add more fields as needed
      })
      .populate({
        path: "companyEmployees", // Populate company employees information
        select: "firstName lastName role email", // Add more fields as needed
      })
      .lean();

    const out = jobs.map(j => {
      const c = j.companyId || {};
      const companySnapshot = {
        _id: c._id,
        companyName: c.companyName,
        city: c.city || "",
        rating: c.rating ?? 4.8,
        profileImageUrl: toCompanyImageUrl(c.profileImage || c.profilePhoto || ""),
        profileImage: c.profileImage || "",
      };

      // If you want to include employee data for each job post
      const companyEmployees = j.companyEmployees || [];
      const employeeData = companyEmployees.map(emp => ({
        firstName: emp.firstName,
        lastName: emp.lastName,
        role: emp.role,
        email: emp.email,
      }));

      return {
        ...j,
        companySnapshot,
        employees: employeeData,  // Add populated employee data
      };
    });

    res.json({ jobs: out });
  } catch (err) {
    console.error("listJobs error:", err);
    res.status(500).json({ message: "Failed to list jobs" });
  }
}

export async function listMyCompanyJobs(req, res) {
  try {
    // find the company doc for this logged-in user
    const company = await Company.findOne({ user: req.user.id }).select("_id");
    if (!company) return res.status(403).json({ message: "No company profile" });

    // pull all jobs for this company (adjust field name if your schema uses `company` not `companyId`)
    const jobs = await Job.find({ companyId: company._id })
      .sort({ createdAt: -1 })
      .lean();

    // return raw jobs; status filtering is done in the UI
    return res.json(jobs);
  } catch (err) {
    console.error("listMyCompanyJobs error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}