import Company from "../models/company.model.js";
import Job from "../models/job.model.js";
import CompanyEmployees from "../models/companyEmployees.model.js";
import path from "path";
import fs from "fs";
import resolveCompanyId from "../utils/resolveCompanyId.js";
import Application from "../models/Application.model.js";

// =======================================================
// 🧩 1️⃣ Helper: Save base64 or file buffer uploads like Profile page
// =======================================================
async function saveImage(base64String, folder = "uploads/company") {
  try {
    if (!base64String) return "";

    // ensure folder exists
    const dirPath = path.resolve(folder);
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

    // extract file extension & data
    const matches = base64String.match(/^data:(.+);base64,(.+)$/);
    if (!matches) return "";

    const ext = matches[1].split("/")[1];
    const data = Buffer.from(matches[2], "base64");
    const fileName = `${Date.now()}.${ext}`;
    const filePath = path.join(dirPath, fileName);

    fs.writeFileSync(filePath, data);
    return fileName;
  } catch (err) {
    console.error("❌ saveImage error:", err);
    return "";
  }
}

// =======================================================
// 🧩 2️⃣ GET /api/company/me
// =======================================================
export const getMe = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId)
      return res.status(401).json({ message: "Unauthorized — no user ID" });

    const companyUser = await Company.findOne({ user: userId }).lean();
    const companyDetails = await CompanyEmployees.findOne({
      $or: [{ userId }, { "owner.email": req.user.email }],
    }).lean();

    if (!companyUser && !companyDetails)
      return res.status(404).json({ message: "Company not found" });

    res.json({
      ...companyUser,
      ...companyDetails,
      user: {
        firstName: companyUser?.firstName || companyDetails?.owner?.firstName || "",
        lastName: companyUser?.lastName || companyDetails?.owner?.lastName || "",
        role: companyUser?.role || companyDetails?.owner?.role || "",
        email: companyUser?.email || companyDetails?.owner?.email || "",
      },
    });
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ message: "Failed to fetch company info" });
  }
};

// =======================================================
// 🧩 3️⃣ POST /api/company/details/save
// =======================================================
export const saveCompanyDetails = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const userEmail = req.user?.email;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const {
      companyName,
      industry,
      description,
      address,
      city,
      province,
      zipCode,
      email,
      website,
      companySize,
      coverPhoto,
      profileImage,
    } = req.body;

    const updateData = {
      industry,
      description,
      address,
      city,
      province,
      zipCode,
      email,
      website,
      companySize,
    };

    // 🧠 Save images if base64 is provided
    if (coverPhoto && coverPhoto.startsWith("data:image/")) {
      const savedCover = await saveImage(coverPhoto, "uploads/company");
      if (savedCover) updateData.coverPhoto = savedCover;
    }
    if (profileImage && profileImage.startsWith("data:image/")) {
      const savedProfile = await saveImage(profileImage, "uploads/company");
      if (savedProfile) updateData.profileImage = savedProfile;
    }

    // ✅ Only update existing record — never insert new
    const companyDoc = await CompanyEmployees.findOneAndUpdate(
      {
        $or: [
          { "owner.email": userEmail },
          { userId },
          { companyName: companyName },
        ],
      },
      { $set: updateData },
      { new: true }
    );

    if (!companyDoc) {
      return res.status(404).json({
        message: "Existing company not found — please check your account",
      });
    }

    // ✅ Sync key fields with main Company model
    await Company.findOneAndUpdate(
      { user: userId },
      { $set: { industry: industry } },
      { new: true }
    );

    console.log("✅ Updated company:", companyDoc.companyName);
    res.json({
      message: "Company details updated successfully",
      data: companyDoc,
    });
  } catch (err) {
    console.error("saveCompanyDetails error:", err);
    res.status(500).json({
      message: err?.message || "Failed to save company details",
    });
  }
};

// =======================================================
// 🧩 4️⃣ GET /api/company/details/:userId
// =======================================================
export const getCompanyDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const details = await CompanyEmployees.findOne({ userId }).lean();
    if (!details)
      return res.status(404).json({ message: "Company details not found" });
    res.json(details);
  } catch (err) {
    console.error("getCompanyDetails error:", err);
    res.status(500).json({ message: "Failed to fetch company details" });
  }
};

// =======================================================
// 🧩 5️⃣ GET /api/company/validate-name
// =======================================================
export const validateCompanyName = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name)
      return res.status(400).json({ message: "Missing company name" });

    const exists = await CompanyEmployees.findOne({
      companyName: { $regex: new RegExp(`^${name}$`, "i") },
    });

    res.json({ exists: !!exists });
  } catch (err) {
    console.error("validateCompanyName error:", err);
    res.status(500).json({ message: "Failed to validate name" });
  }
};

export async function listCompanyJobs(req, res) {
  try {
    const companyId = await resolveCompanyId(req);
    if (!companyId) return res.status(403).json({ message: "Company not found for user." });

    const jobs = await Job.find({
      $or: [
        { companyId: companyId },                    // when Job.companyId = CompanyEmployees _id
        { "companyId._id": companyId },              // when populated/embedded
      ],
    })
    .sort({ createdAt: -1 })
    .lean();

    res.json(jobs);
  } catch (err) {
    console.error("listCompanyJobs error:", err);
    res.status(500).json({ message: "Failed to fetch company jobs" });
  }
}



//NEW CHANGES OR ADDED


/**
 * Update a job (edit fields or change status/isArchived)
 * PATCH /api/company/jobs/:id
 */
export const updateJob = async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};

  const pickFirst = (...vals) =>
    vals.find(v => v !== undefined && v !== null && String(v).trim() !== "");

  const toArray = (v) => {
    if (Array.isArray(v)) return v.map(String).map(s => s.trim()).filter(Boolean);
    if (typeof v === "string") {
      return v.split(/,|\n|•|-/).map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  const toDate = (v) => {
    if (!v) return undefined;
    const s = String(v);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s); // "YYYY-MM-DD"
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? undefined : d;
  };

  try {
    // Load current job so we can safely merge the date range
    const current = await Job.findById(id);
    if (!current) return res.status(404).json({ message: "Job not found" });

    const patch = {};

    // Core text
    if (body.title !== undefined) patch.title = String(body.title).trim();
    if (body.description !== undefined) patch.description = String(body.description || "");

    // Department (your schema uses 'department', not 'category')
    const department = pickFirst(body.department, body.category, body.categoryName);
    if (department !== undefined) patch.department = String(department).trim();

    // Location
    const location = pickFirst(body.location, body.city);
    if (location !== undefined) patch.location = String(location).trim();

    // Employment type
    const jobType = pickFirst(body.jobType, body.type, body.employmentType);
    if (jobType !== undefined) patch.jobType = String(jobType).trim();

    // Work arrangement
    const workType = pickFirst(body.workType, body.mode, body.workArrangement, body.locationType);
    if (workType !== undefined) patch.workType = String(workType).trim();

    // Salary (setter pesoifies)
    const salary = pickFirst(body.salaryMax, body.salary, body.salaryRange);
    if (salary !== undefined) patch.salaryMax = salary;

    // Arrays (required in your schema)
    if (body.skills !== undefined || body.skillsText !== undefined) {
      patch.skills = toArray(body.skills ?? body.skillsText);
    }
    if (body.requirements !== undefined || body.requirementsText !== undefined) {
      patch.requirements = toArray(body.requirements ?? body.requirementsText);
    }
    if (body.responsibilities !== undefined || body.responsibilitiesText !== undefined) {
      patch.responsibilities = toArray(body.responsibilities ?? body.responsibilitiesText);
    }
    if (body.offers !== undefined || body.perks !== undefined) {
      patch.offers = toArray(body.offers ?? body.perks);
    }
    if (body.educationLevel !== undefined) {
      patch.educationLevel = toArray(body.educationLevel);
    }
    if (body.languages !== undefined || body.languagesText !== undefined) {
      patch.languages = toArray(body.languages ?? body.languagesText);
    }
    if (body.screeningQuestions !== undefined) {
      patch.screeningQuestions = toArray(body.screeningQuestions);
    }

    // Experience level
    const exp = pickFirst(body.experienceLevel, body.level);
    if (exp !== undefined) patch.experienceLevel = String(exp).trim();

    // Timeline: map flat fields to nested startDateRange
    let from = pickFirst(body.startDateFrom, body.startFrom, body.startDateRange?.from);
    let to   = pickFirst(body.startDateTo, body.startTo, body.startDateRange?.to);
    if (from !== undefined || to !== undefined) {
      const newFrom = toDate(from) || current.startDateRange?.from;
      const newTo   = toDate(to)   || current.startDateRange?.to;
      patch.startDateRange = { from: newFrom, to: newTo };
    }

    // Application deadline
    if (body.applicationDeadline !== undefined || body.deadline !== undefined) {
      const dl = toDate(pickFirst(body.applicationDeadline, body.deadline));
      if (dl) patch.applicationDeadline = dl;
    }

    // Status (no isArchived in schema)
    if (typeof body.status === "string") {
      patch.status = body.status.trim(); // "open" | "pending" | "closed" | "archived" | "deleted" | "suspended"
    }



    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const updated = await Job.findByIdAndUpdate(
      id,
      { $set: patch },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Job not found" });

    // Frontend expects { job }
    return res.json({ job: updated });
  } catch (err) {
    console.error("updateJob error:", err);
    return res.status(500).json({ message: err.message || "Failed to update job" });
  }
};


export const deleteJob = async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await Job.findByIdAndUpdate(
      id,
      { $set: { status: "deleted" } },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Job not found" });
    return res.json({ message: "Job soft-deleted", job: updated });
  } catch (err) {
    console.error("deleteJob error:", err);
    return res.status(500).json({ message: err.message || "Failed to delete job" });
  }
};

// fetching applicant in that specific job
async function getApplicantsByJobId(req, res) {
  const { jobId } = req.params;  // Get jobId from the route parameters

  try {
    // Find all applications for the given jobId
    const applications = await Application.find({ job: jobId })
      .populate("student", "name email"); // Assuming you're populating student details

    if (!applications.length) {
      return res.status(404).json({ message: "No applicants found for this job" });
    }

    // Return the applications (list of applicants)
    return res.json(applications);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching applicants", error });
  }
}

export { getApplicantsByJobId };