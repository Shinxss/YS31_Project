// routes/admin.jobs.routes.js
import express from "express";
import Job from "../models/job.model.js";
import { requireAuth } from "../middlewares/AdminAuth.js";

const router = express.Router();

// Fetch all job listings with application counts
router.get("/jobs", requireAuth, async (req, res) => {
  try {
    // Use aggregation to get jobs with application counts
    const jobs = await Job.aggregate([
      {
        $lookup: {
          from: "applications",
          localField: "_id",
          foreignField: "job",
          as: "applications",
        },
      },
      {
        $addFields: {
          applicationsCount: { $size: { $ifNull: ["$applications", []] } },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          companyName: 1,
          companyId: 1,
          location: 1,
          workType: 1,
          jobType: 1,
          department: 1,
          salaryMax: 1,
          status: 1,
          applicationsCount: 1,
          createdAt: 1,
          updatedAt: 1,
          description: 1,
          skills: 1,
          requirements: 1,
          responsibilities: 1,
          offers: 1,
          startDateRange: 1,
          applicationDeadline: 1,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    res.status(200).json(jobs);
  } catch (err) {
    console.error("Error fetching jobs:", err);
    res.status(500).json({ message: "Failed to fetch job listings" });
  }
});

// Update job status
router.patch("/jobs/:id/status", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["open", "pending", "closed", "archived", "suspended"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const job = await Job.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({ message: "Job status updated successfully", job });
  } catch (err) {
    console.error("Error updating job status:", err);
    res.status(500).json({ message: "Failed to update job status" });
  }
});

export default router;
