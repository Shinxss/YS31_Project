// controllers/admin.users.controller.js
import Student from "../models/student.model.js";      // collection: student_users
import Company from "../models/companyEmployees.model.js";      // collection: company_users

// Shape a student for the table
const shapeStudent = (s) => ({
  _id: s._id,
  name: [s.firstName, s.lastName].filter(Boolean).join(" ") || s.name || "—",
  school: s.school || "—",
  email: s.email || s.contactEmail || "—",
  status: s.status || "active", // default if absent
});

// Shape a company for the table
const shapeCompany = (c) => ({
  _id: c._id,
  name: c.companyName || c.name || "—",
  location: c.location || c.city || c.province || "—",
  email: c.email || c.email1 || c.contactEmail || "—",
  status: c.status || "active",
});

/** GET /api/admin/users/students */
export const listStudents = async (req, res) => {
  try {
    const rows = await Student.find({}, { // light projection
      firstName: 1, lastName: 1, school: 1, email: 1, contactEmail: 1, status: 1
    }).lean();
    return res.json(rows.map(shapeStudent));
  } catch (err) {
    console.error("listStudents error:", err);
    return res.status(500).json({ message: "Failed to load students" });
  }
};

/** GET /api/admin/users/companies */
export const listCompanies = async (req, res) => {
  try {
    const rows = await Company.find({}, {
      companyName: 1, name: 1, location: 1, city: 1, province: 1,
      email: 1, email1: 1, contactEmail: 1, status: 1
    }).lean();
    return res.json(rows.map(shapeCompany));
  } catch (err) {
    console.error("listCompanies error:", err);
    return res.status(500).json({ message: "Failed to load companies" });
  }
};

/** PATCH /api/admin/users/students/:id/status  { status } */
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

/** PATCH /api/admin/users/companies/:id/status  { status } */
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
    return res.json(shapeCompany(doc));
  } catch (err) {
    console.error("setCompanyStatus error:", err);
    return res.status(500).json({ message: "Failed to update status" });
  }
};
