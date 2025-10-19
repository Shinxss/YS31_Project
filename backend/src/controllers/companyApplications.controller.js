// src/controllers/companyApplications.controller.js
import Application from "../models/Application.model.js";
import Company from "../models/company.model.js";


// tiny logger (dev only)
const log = (...a) => console.log("[company/apps]", ...a);

async function getCompanyForUser(req) {
  const uid = req.user?.id;
  const email = (req.user?.email || "").toLowerCase();
  if (!uid && !email) return null;

  // try by user ObjectId first, then by email
  let company =
    (uid ? await Company.findOne({ user: uid }) : null) ||
    (email ? await Company.findOne({ email }) : null);

  return company;
}

export async function listCompanyApplications(req, res) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const company = await getCompanyForUser(req);

    if (!company?._id) {
      log("No company profile linked to user:", req.user?.id, req.user?.email);
      return res.json([]); // show “No applications yet” in UI
    }

    // Some older docs might only have companyName saved
    const orQuery = [{ company: company._id }];
    if (company.companyName) orQuery.push({ companyName: company.companyName });

    const apps = await Application.find({ $or: orQuery })
      .sort({ createdAt: -1 })
      .populate({
        path: "student",
        model: "Student",
        select: "firstName lastName fullName email profilePicture",
        options: { lean: true },
      })
      .populate({
        path: "job",
        model: "Job",
        select: "title department",
        options: { lean: true },
      })
      .lean();

    log("applications found:", apps.length);

    const items = apps.map((a) => ({
      _id: a._id,
      status: a.status || "Application Sent",
      appliedAt: a.createdAt,
      createdAt: a.createdAt,
      resume: a.resume || null,
      message: a.message || "",
      student: a.student
        ? {
            _id: a.student._id,
            firstName: a.student.firstName,
            lastName: a.student.lastName,
            fullName:
              a.student.fullName ||
              [a.student.firstName, a.student.lastName]
                .filter(Boolean)
                .join(" "),
            email: a.student.email,
            profilePicture: a.student.profilePicture || "",
          }
        : null,
      job: a.job
        ? { _id: a.job._id, title: a.job.title, department: a.job.department }
        : null,
    }));

    return res.json(items);
  } catch (err) {
    console.error("listCompanyApplications error:", err);
    return res.status(500).json({ message: "Failed to load applications" });
  }
}
