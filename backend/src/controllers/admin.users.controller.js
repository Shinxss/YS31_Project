// controllers/admin.users.controller.js
import Student from "../models/student.model.js";      // collection: student_users
import Company from "../models/companyEmployees.model.js";
import Job from "../models/job.model.js";

const getJobPostCount = async (companyId) => {
  const jobCount = await Job.countDocuments({ companyId });
  return jobCount || 0;
};

// Shape a company for the table with all required fields
const shapeCompany = async (c) => {
  // Count job posts associated with the company
  const jobPostCount = await getJobPostCount(c._id);

  // Format location as Address, City, Province, Zip Code
  const location = [
    c.address || "—", 
    c.city || "—", 
    c.province || "—", 
    c.zipCode || "—"
  ].join(", ");

  return {
    _id: c._id,
    companyName: c.companyName || c.name || "—",
    email: c.email || c.email1 || c.contactEmail || "—",
    firstName: c.owner?.firstName || "—",  // Assuming owner's first name
    role: c.owner?.role || "—",  // Assuming owner's role
    industry: c.industry || "—",
    location: location,
    jobPostCount: jobPostCount,
    createdAt: c.createdAt || "—",
  };
};

/** GET /api/admin/users/companies */
export const listCompanies = async (req, res) => {
  try {
    const rows = await Company.find({}, {
      companyName: 1, email: 1, owner: 1, industry: 1, address: 1, city: 1, province: 1, zipCode: 1, createdAt: 1
    }).lean();

    // Map all companies to our shapeCompany function
    const companyList = await Promise.all(rows.map(shapeCompany));
    return res.json(companyList);
  } catch (err) {
    console.error("listCompanies error:", err);
    return res.status(500).json({ message: "Failed to load companies" });
  }
};

/** PATCH /api/admin/users/companies/:id/status { status } */
export const setCompanyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!["active", "disabled", "blocked"].includes(String(status).toLowerCase())) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const doc = await Company.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    ).lean();
    if (!doc) return res.status(404).json({ message: "Company not found" });
    return res.json(await shapeCompany(doc));
  } catch (err) {
    console.error("setCompanyStatus error:", err);
    return res.status(500).json({ message: "Failed to update status" });
  }
};


//-----------------------STUDENT----------------------
const shapeStudent = (s) => ({
  _id: s._id,
  firstName: s.firstName || "—",
  lastName: s.lastName || "—",
  email: s.email || s.contactEmail || "—",
  course: s.course || "—",
  age: s.age || "—",
  gender: s.gender || "—",
  location: s.location || "—", // You can format this if needed
  applicationCount: s.applications?.length || 0,  // Count of applications
  skillsCount: s.skills?.length || 0,  // Count of skills
  experienceCount: s.experience?.length || 0,  // Count of experience entries
  educationCount: s.education?.length || 0,  // Count of education entries
  certificationCount: s.certification?.length || 0,  // Count of certifications
});

/** GET /api/admin/users/students */
export const listStudents = async (req, res) => {
  try {
    const students = await Student.find({}, {
      firstName: 1, lastName: 1, email: 1, course: 1, age: 1, gender: 1, location: 1,
      applications: 1, skills: 1, experience: 1, education: 1, certification: 1,
    }).lean();

    // Map all students to our shapeStudent function
    const studentList = students.map(shapeStudent);
    return res.json(studentList);
  } catch (err) {
    console.error("listStudents error:", err);
    return res.status(500).json({ message: "Failed to load students" });
  }
};

/** PATCH /api/admin/users/students/:id/status { status } */
export const setStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!["active", "disabled", "blocked"].includes(String(status).toLowerCase())) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const doc = await Student.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    ).lean();
    if (!doc) return res.status(404).json({ message: "Student not found" });
    return res.json(shapeStudent(doc));
  } catch (err) {
    console.error("setStudentStatus error:", err);
    return res.status(500).json({ message: "Failed to update status" });
  }
};
