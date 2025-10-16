// controllers/studentApplications.controller.js
import Application from "../models/Application.model.js";
import Job from "../models/job.model.js";

// GET /api/student/applications
export const listMyApplications = async (req, res) => {
  try {
    const studentId = req.user.id;

    const apps = await Application.find({ student: studentId })
      .sort({ createdAt: -1 })
      .populate({
        path: "job",
        select:
          "title companyName location department workType jobType applicationDeadline",
        model: Job, // if your Job is registered as "Job" you can omit "model"
      })
      .lean();

    res.json({ applications: apps });
  } catch (err) {
    console.error("listMyApplications error:", err);
    res.status(500).json({ message: "Failed to load applications" });
  }
};
