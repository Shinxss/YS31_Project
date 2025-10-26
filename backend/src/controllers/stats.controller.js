import Student from "../models/student.model.js";
import Company from "../models/company.model.js";
import CompanyEmployees from "../models/companyEmployees.model.js";
import Job from "../models/job.model.js";
import Application from "../models/Application.model.js";

export const publicStats = async (_req, res) => {
  try {
    const studentsP = Student.countDocuments({});
    const companyEmpCountP = CompanyEmployees.estimatedDocumentCount();
    const companyUsersCountP = Company.countDocuments({});

    const jobsP = Job.countDocuments({ status: "open" });

    const [students, companyEmpCount, companyUsersCount, jobs] = await Promise.all([
      studentsP,
      companyEmpCountP,
      companyUsersCountP,
      jobsP,
    ]);

    const companies = companyEmpCount > 0 ? companyEmpCount : companyUsersCount;

    return res.json({
      activeStudents: students,
      companies,
      internships: jobs,
    });
  } catch (err) {
    console.error("publicStats error:", err);
    return res.status(500).json({ message: "Failed to load stats" });
  }
};


//----------------NEW-----------------------

export async function getMonthlyApplications(req, res) {
  try {
    const TZ = "Asia/Manila"; // keep this consistent

    // 1) Group by month in the correct timezone
    const agg = await Application.aggregate([
      {
        $group: {
          _id: { $dateTrunc: { date: "$createdAt", unit: "month", timezone: TZ } },
          applications: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Helper to make a YYYY-MM key in the target TZ
    const makeKey = (d) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: TZ,
        year: "numeric",
        month: "2-digit",
      }).format(d); // e.g., "2025-10"

    // 2) Index aggregation by YYYY-MM key (in TZ)
    const bucketMap = new Map();
    for (const b of agg) {
      bucketMap.set(makeKey(new Date(b._id)), b.applications);
    }

    // 3) Build last 12 months skeleton in the same TZ
    const now = new Date();
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const series = [];

    for (let i = 11; i >= 0; i--) {
      // create a date object then shift month locally; key is generated in TZ
      const d = new Date(now);
      d.setMonth(d.getMonth() - i, 1); // day = 1 to avoid DST/edge issues
      d.setHours(0, 0, 0, 0);

      const key = makeKey(d);
      // label in TZ as well
      const mIdx = Number(key.slice(5, 7)) - 1; // 0..11
      const label = months[mIdx];

      series.push({
        month: label,
        applications: bucketMap.get(key) ?? 0,
      });
    }

    return res.json(series);
  } catch (err) {
    console.error("getMonthlyApplications TZ-safe error:", err);
    return res.status(500).json({ message: "Failed to load monthly applications" });
  }
}

export async function getApplicationCounts(req, res) {
  try {
    const { companyId, jobId, studentId } = req.query;

    // Build optional filters
    const match = {};
    if (companyId) match.company = companyId;
    if (jobId) match.job = jobId;
    if (studentId) match.student = studentId;

    // Aggregate per-status counts (case-insensitive)
    const grouped = await Application.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $cond: [
              { $or: [{ $eq: ["$status", null] }, { $eq: ["$status", ""] }] },
              "unknown",
              { $toLower: "$status" },
            ],
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const byStatus = grouped.map((g) => ({
      status: g._id,
      count: g.count,
    }));

    const totalApplications =
      byStatus.reduce((acc, x) => acc + x.count, 0) || 0;

    // Also return a convenient object map
    const statuses = byStatus.reduce((acc, x) => {
      acc[x.status] = x.count;
      return acc;
    }, {});

    return res.json({
      totalApplications,
      statuses, // e.g., { accepted: 10, rejected: 5, pending: 7 }
      byStatus, // array form if you prefer for charts
    });
  } catch (err) {
    console.error("getApplicationCounts error:", err);
    return res
      .status(500)
      .json({ message: "Failed to compute application counts" });
  }
}