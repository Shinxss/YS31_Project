// src/controllers/companyApplications.controller.js
import Application from "../models/Application.model.js";
import Company from "../models/company.model.js";

/* ---------- tiny logger (dev only) ---------- */
const dbg =
  process.env.NODE_ENV === "production"
    ? () => {}
    : (...a) => console.log("[company/apps]", ...a);

/* ---------- helpers ---------- */
async function getCompanyForUser(req) {
  const uid = req.user?.id;
  const email = (req.user?.email || "").toLowerCase();
  if (!uid && !email) return null;
  return (
    (uid ? await Company.findOne({ user: uid }) : null) ||
    (email ? await Company.findOne({ email }) : null)
  );
}

/* =========================================================
   GET /api/company/applications
   List applications for this company
========================================================= */
export async function listCompanyApplications(req, res) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const company = await getCompanyForUser(req);
    if (!company?._id) return res.json([]);

    const orQuery = [{ company: company._id }];
    if (company.companyName) orQuery.push({ companyName: company.companyName });

    const apps = await Application.find({ $or: orQuery })
      .sort({ createdAt: -1 })
      .populate({
        path: "student",
        model: "Student", // matches your model export
        select:
          "firstName lastName email profilePicture course school skills bio education",
        options: { lean: true },
      })
      .populate({
        path: "job",
        model: "Job",
        select: "title department",
        options: { lean: true },
      })
      .lean();

    dbg("applications found:", apps.length);

    const items = apps.map((a) => {
      const school =
        a?.student?.school ||
        (Array.isArray(a?.student?.education) &&
          a.student.education[0]?.school) ||
        "";

      return {
        _id: a._id,
        status: a.status || "New",
        appliedAt: a.createdAt,
        createdAt: a.createdAt,
        resume: a.resume || null,
        message: a.message || "",
        answers: Array.isArray(a.answers) ? a.answers : [], // include answers
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
              course: a.student.course || "",
              school,
              skills: a.student.skills || [],
              bio: a.student.bio || "",
            }
          : null,
        job: a.job
          ? {
              _id: a.job._id,
              title: a.job.title,
              department: a.job.department,
            }
          : null,
      };
    });

    return res.json(items);
  } catch (err) {
    console.error("listCompanyApplications error:", err);
    return res.status(500).json({ message: "Failed to load applications" });
  }
}

/* =========================================================
   GET /api/company/applications/:id
   Single application (for review modal)
========================================================= */
export async function getCompanyApplication(req, res) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const company = await getCompanyForUser(req);
    if (!company?._id)
      return res.status(404).json({ message: "Company not found" });

    const { id } = req.params;

    const app = await Application.findOne({
      _id: id,
      $or: [{ company: company._id }, { companyName: company.companyName }],
    })
      .populate({
        path: "student",
        select:
          "firstName lastName email profilePicture course bio skills education",
        options: { lean: true },
      })
      .populate({
        path: "job",
        select: "title department",
        options: { lean: true },
      })
      .lean();

    if (!app) return res.status(404).json({ message: "Application not found" });

    const school =
      app?.student?.school ||
      (Array.isArray(app?.student?.education) &&
        app.student.education[0]?.school) ||
      "";

    return res.json({
      _id: app._id,
      status: app.status || "Application Sent",
      createdAt: app.createdAt,
      resume: app.resume || null,
      message: app.message || "",
      answers: Array.isArray(app.answers) ? app.answers : [],
      student: app.student
        ? {
            _id: app.student._id,
            firstName: app.student.firstName,
            lastName: app.student.lastName,
            fullName: [app.student.firstName, app.student.lastName]
              .filter(Boolean)
              .join(" "),
            email: app.student.email,
            profilePicture: app.student.profilePicture || "",
            course: app.student.course || "",
            school,
            skills: app.student.skills || [],
            bio: app.student.bio || "",
          }
        : null,
      job: app.job
        ? { _id: app.job._id, title: app.job.title, department: app.job.department }
        : null,
    });
  } catch (err) {
    console.error("getCompanyApplication error:", err);
    res.status(500).json({ message: "Failed to load application" });
  }
}