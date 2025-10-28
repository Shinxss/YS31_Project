// controllers/admin.users.controller.js
import Student from "../models/student.model.js";      // collection: student_users
import Company from "../models/companyEmployees.model.js";
import Job from "../models/job.model.js";
import User from "../models/user.model.js";

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
    isVerified: c.isVerified || false,
  };
};

/** GET /api/admin/users/companies */
export const listCompanies = async (req, res) => {
  try {
    const rows = await Company.find({}, {
      companyName: 1, email: 1, owner: 1, industry: 1, address: 1, city: 1, province: 1, zipCode: 1, createdAt: 1, isVerified: 1
    }).lean();

    // Get status and createdAt from the users collection based on the company owner email
    const companyList = await Promise.all(rows.map(async (company) => {
      const user = await User.findOne({ email: company.owner?.email }).lean();
      const companyData = await shapeCompany(company);
      companyData.status = user?.status || "active";  // Add the status from the users collection
      companyData.accountCreatedAt = user?.createdAt || "—";  // Add account creation date
      return companyData;
    }));

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
    
    // Get the company first to find the owner email
    const company = await Company.findById(id).lean();
    if (!company) return res.status(404).json({ message: "Company not found" });
    
    // Update status in User collection based on owner email
    await User.updateOne(
      { email: company.owner?.email },
      { $set: { status } }
    );
    
    // Return updated company data with new status
    const updatedUser = await User.findOne({ email: company.owner?.email }).lean();
    const companyData = await shapeCompany(company);
    companyData.status = updatedUser?.status || status;
    companyData.accountCreatedAt = updatedUser?.createdAt || company.createdAt;
    
    return res.json(companyData);
  } catch (err) {
    console.error("setCompanyStatus error:", err);
    return res.status(500).json({ message: "Failed to update status" });
  }
};

/** PATCH /api/admin/users/companies/:id/verify { isVerified } */
export const setCompanyVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body || {};

    if (typeof isVerified !== "boolean") {
      return res.status(400).json({ message: "Invalid isVerified value" });
    }

    // Update verification status in Company collection
    const company = await Company.findByIdAndUpdate(
      id,
      { $set: { isVerified } },
      { new: true }
    ).lean();

    if (!company) return res.status(404).json({ message: "Company not found" });

    // Return updated company data
    const companyData = await shapeCompany(company);
    const user = await User.findOne({ email: company.owner?.email }).lean();
    companyData.status = user?.status || "active";
    companyData.accountCreatedAt = user?.createdAt || company.createdAt;

    return res.json(companyData);
  } catch (err) {
    console.error("setCompanyVerification error:", err);
    return res.status(500).json({ message: "Failed to update verification status" });
  }
};

/** GET /api/admin/users/companies/:id */
export const getCompanyDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id).lean();
    if (!company) return res.status(404).json({ message: "Company not found" });

    // Shape the company data
    const companyData = await shapeCompany(company);

    // Get status and createdAt from the users collection based on the company owner email
    const user = await User.findOne({ email: company.owner?.email }).lean();
    companyData.status = user?.status || "active";
    companyData.accountCreatedAt = user?.createdAt || company.createdAt;

    return res.json(companyData);
  } catch (err) {
    console.error("getCompanyDetails error:", err);
    return res.status(500).json({ message: "Failed to load company details" });
  }
};


//-----------------------STUDENT----------------------
const shapeStudent = (s) => {
  // Extract school from education array (most recent if available)
  const getSchool = () => {
    if (!Array.isArray(s.education) || s.education.length === 0) return "—";
    // Get the most recent education entry
    const sorted = [...s.education].sort((a, b) => {
      const pa = Date.parse(a?.endDate || "") || 0;
      const pb = Date.parse(b?.endDate || "") || 0;
      return pb - pa;
    });
    return sorted[0]?.school || "—";
  };

  return {
    _id: s._id,
    firstName: s.firstName || "—",
    lastName: s.lastName || "—",
    email: s.email || s.contactEmail || "—",
    course: s.course || "—",
    school: getSchool(),
    age: s.age || "—",
    gender: s.gender || "—",
    location: s.location || "—", // You can format this if needed
    applicationCount: s.applications?.length || 0,  // Count of applications
    skillsCount: s.skills?.length || 0,  // Count of skills
    experienceCount: s.experience?.length || 0,  // Count of experience entries
    educationCount: s.education?.length || 0,  // Count of education entries
    certificationCount: s.certification?.length || 0,  // Count of certifications
  };
};

/** GET /api/admin/users/students */
export const listStudents = async (req, res) => {
  try {
    const students = await Student.find({}, {
      firstName: 1, lastName: 1, email: 1, course: 1, age: 1, gender: 1, location: 1,
      applications: 1, skills: 1, experience: 1, education: 1, certification: 1
    }).lean();

    // Get status and createdAt from the users collection based on student email
    const studentList = await Promise.all(students.map(async (student) => {
      const user = await User.findOne({ email: student.email }).lean();
      const studentData = shapeStudent(student);
      studentData.status = user?.status || "active";  // Add the status from the users collection
      studentData.accountCreatedAt = user?.createdAt || "—";  // Add account creation date
      return studentData;
    }));

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
    
    // Get the student first to find their email
    const student = await Student.findById(id).lean();
    if (!student) return res.status(404).json({ message: "Student not found" });
    
    // Update status in User collection based on student email
    await User.updateOne(
      { email: student.email },
      { $set: { status } }
    );
    
    // Return updated student data with new status
    const updatedUser = await User.findOne({ email: student.email }).lean();
    const studentData = shapeStudent(student);
    studentData.status = updatedUser?.status || status;
    studentData.accountCreatedAt = updatedUser?.createdAt || student.createdAt;
    
    return res.json(studentData);
  } catch (err) {
    console.error("setStudentStatus error:", err);
    return res.status(500).json({ message: "Failed to update status" });
  }
};
