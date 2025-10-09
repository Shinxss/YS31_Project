import Student from "../models/student.model.js";
import Company from "../models/company.model.js";
import CompanyEmployees from "../models/companyEmployees.model.js";
import Job from "../models/job.model.js";

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
