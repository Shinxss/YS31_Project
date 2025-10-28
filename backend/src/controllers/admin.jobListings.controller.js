// backend/src/controllers/admin.jobListings.controller.js
import Job from "../models/job.model.js";
import CompanyEmployees from "../models/companyEmployees.model.js";

/**
 * GET /api/admin/job-listings
 * Fetch all jobs (except deleted)
 */
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({})
      .sort({ createdAt: -1 })
      .lean();
    res.json(jobs);
  } catch (err) {
    console.error("getAllJobs error:", err);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

/**
 * DELETE /api/admin/job-listings/:id
 * Completely remove a job posting from the database.
 */
export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the job first
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Optional: If you store job IDs in CompanyEmployees (like job references),
    // remove it there as well.
    if (job.companyId) {
      await CompanyEmployees.updateOne(
        { _id: job.companyId },
        { $pull: { jobs: job._id } } // if you have a jobs[] array in that model
      );
    }

    // Hard delete from database
    await Job.findByIdAndDelete(id);

    res.json({ message: "Job permanently deleted from the database." });
  } catch (err) {
    console.error("deleteJob error:", err);
    res.status(500).json({ message: "Failed to delete job" });
  }
};
