// backend/src/controllers/job.controller.js
import User from "../models/user.model.js";
import Company from "../models/company.model.js";
import Job from "../models/job.model.js";

// Create a job (company only)
export const createJob = async (req, res) => {
  try {
    if (req.user.role !== "company") {
      return res.status(403).json({ message: "Forbidden: company only" });
    }

    const authUser = await User.findById(req.user.id).lean();
    if (!authUser) return res.status(401).json({ message: "Unauthorized" });

    const company =
      (await Company.findOne({ email: authUser.email }).lean()) ||
      (await Company.findOne({ userId: authUser._id }).lean());
    if (!company) return res.status(400).json({ message: "Company profile not found" });

    const {
      title,
      salaryMin,
      salaryMax,
      salaryCurrency,
      startDate,
      durationMonths,
      location,
      workType,
      description,
      tags,
    } = req.body;

    if (!title?.trim()) return res.status(400).json({ message: "Job title is required" });

    const job = await Job.create({
      companyId: company._id,
      companyName: company.companyName,
      title: title.trim(),
      salaryMin: salaryMin ?? undefined,
      salaryMax: salaryMax ?? undefined,
      salaryCurrency: salaryCurrency || "PHP",
      startDate: startDate ? new Date(startDate) : undefined,
      durationMonths: durationMonths ?? undefined,
      location: location || "",
      workType: workType || "On-site",
      description: description || "",
      tags: Array.isArray(tags) ? tags : [],
      status: "open",
    });

    return res.status(201).json({ message: "Job posted", job });
  } catch (err) {
    console.error("createJob error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// List jobs for the logged-in company
export const myJobs = async (req, res) => {
  try {
    if (req.user.role !== "company") {
      return res.status(403).json({ message: "Forbidden: company only" });
    }

    const authUser = await User.findById(req.user.id).lean();
    if (!authUser) return res.status(401).json({ message: "Unauthorized" });

    const company =
      (await Company.findOne({ email: authUser.email }).lean()) ||
      (await Company.findOne({ userId: authUser._id }).lean());
    if (!company) return res.status(400).json({ message: "Company profile not found" });

    const jobs = await Job.find({ companyId: company._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ jobs });
  } catch (err) {
    console.error("myJobs error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
