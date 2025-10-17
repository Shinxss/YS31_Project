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
        model: Job,
      })
      .lean();

    res.json({ applications: apps });
  } catch (err) {
    console.error("listMyApplications error:", err);
    res.status(500).json({ message: "Failed to load applications" });
  }
};

// GET /api/student/applications/summary
export const getMyApplicationsSummary = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ message: "Unauthorized" });

    const [total, accepted, rejected, applied] = await Promise.all([
      Application.countDocuments({ student: studentId }),
      Application.countDocuments({ student: studentId, status: "Accepted" }),
      Application.countDocuments({ student: studentId, status: "Rejected" }),
      Application.countDocuments({ student: studentId, status: "Applied" }),
    ]);

    const successRate =
      total > 0 ? Number(((accepted / total) * 100).toFixed(2)) : 0;

    res.json({ total, accepted, rejected, applied, successRate });
  } catch (err) {
    console.error("getMyApplicationsSummary error:", err);
    res.status(500).json({ message: "Failed to load application summary" });
  }
};

// ✅ GET /api/student/applications/summary/week (Mon→Sun)
export const getMyApplicationsThisWeek = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ message: "Unauthorized" });

    const now = new Date();
    const day = now.getDay(); // 0 Sun..6 Sat
    const diffToMonday = (day === 0 ? -6 : 1) - day; // back to Monday
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + diffToMonday,
      0, 0, 0, 0
    );
    const endOfWeek = new Date(
      startOfWeek.getFullYear(),
      startOfWeek.getMonth(),
      startOfWeek.getDate() + 7,
      0, 0, 0, 0
    );

    const addedThisWeek = await Application.countDocuments({
      student: studentId,
      createdAt: { $gte: startOfWeek, $lt: endOfWeek },
    });

    res.json({
      weekStart: startOfWeek.toISOString(),
      weekEnd: endOfWeek.toISOString(),
      addedThisWeek,
    });
  } catch (err) {
    console.error("getMyApplicationsThisWeek error:", err);
    res.status(500).json({ message: "Failed to load this-week application summary" });
  }
};
