// controllers/admin.export.controller.js
import Student from "../models/student.model.js";
import Job from "../models/job.model.js";
import Application from "../models/Application.model.js";
import CompanyEmployee from "../models/companyEmployees.model.js"; // for the "Companies" sheet
import { Parser as Json2Csv } from "json2csv";
import ExcelJS from "exceljs";
import archiver from "archiver";

/**
 * Sheets:
 * - students     → Student model
 * - companies    → CompanyEmployee (company profiles; no pics/cover/desc; with ownerName)
 * - jobs         → Job + lookup company_employees + count applications
 * - applications → Application + lookup student_users, jobs, company_employees  ✅
 */

function getDisplayNameLike(obj) {
  if (!obj) return "";
  return (
    obj.fullname ||
    obj.fullName ||
    (obj.firstName && obj.lastName ? `${obj.firstName} ${obj.lastName}` : null) ||
    obj.firstName ||
    obj.lastName ||
    obj.name ||
    ""
  );
}

const MAP = {
  students: {
    label: "Students",
    fetch: async () =>
      (await Student.find().lean()).map((s) => ({
        id: String(s._id),
        firstName: s.firstName || "",
        lastName: s.lastName || "",
        email: s.email || "",
        school: s.school || "",
        course: s.course || "",
        major: s.major || "",
        location: s.location || "",
        status: s.status || "active",
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
  },

  companies: {
    label: "Companies (Profiles)",
    fetch: async () =>
      (await CompanyEmployee.find().lean()).map((c) => ({
        id: String(c._id),
        companyName: c.companyName || c.name || "",
        ownerName: getDisplayNameLike(c.owner),
        email: c.email || c.contactEmail || c.owner?.email || c.owner?.email1 || "",
        address: c.address || "",
        city: c.city || "",
        province: c.province || "",
        zipCode: c.zipCode || c.zipcode || "",
        website: c.website || "",
        industry: c.industry || "",
        companySize: c.companysize || c.companySize || "",
        employeesCount: Array.isArray(c.employees) ? c.employees.length : 0,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
  },

  jobs: {
    label: "Job Listings",
    fetch: async () => {
      const rows = await Job.aggregate([
        {
          $lookup: {
            from: "company_employees",
            let: { comp: { $ifNull: ["$companyId", "$company"] } },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$comp"] } } },
              { $project: { companyName: 1 } },
            ],
            as: "companyDoc",
          },
        },
        {
          $lookup: {
            from: "applications",
            localField: "_id",
            foreignField: "job",
            as: "apps",
          },
        },
        {
          $addFields: {
            applicationsCount: { $size: { $ifNull: ["$apps", []] } },
            companyNameFromJoin: {
              $ifNull: [{ $arrayElemAt: ["$companyDoc.companyName", 0] }, ""],
            },
          },
        },
        {
          $project: {
            _id: 1,
            companyName: {
              $cond: [
                { $ifNull: ["$companyName", false] },
                "$companyName",
                "$companyNameFromJoin",
              ],
            },
            title: 1,
            workType: 1,
            jobType: 1,
            department: 1,
            location: 1,
            status: 1,
            applicationsCount: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]);

      return rows.map((j) => ({
        id: String(j._id),
        companyName: j.companyName || "",
        title: j.title || "",
        workType: j.workType || "",
        jobType: j.jobType || "",
        department: j.department || "",
        location: j.location || "",
        status: j.status || "",
        applicationsCount: Number(j.applicationsCount || 0),
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
      }));
    },
  },

  applications: {
    label: "Applications",
    fetch: async () => {
      // ✅ Use company profile collection (company_employees) — not company users
      const rows = await Application.aggregate([
        { $lookup: { from: "student_users", localField: "student", foreignField: "_id", as: "stu" } },
        { $lookup: { from: "jobs",           localField: "job",     foreignField: "_id", as: "jobDoc" } },
        {
          $lookup: {
            from: "company_employees",
            let: { comp: { $ifNull: ["$company", "$companyId"] } },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$comp"] } } },
              { $project: { companyName: 1, email: 1 } },
            ],
            as: "compDoc",
          },
        },
        {
          $addFields: {
            studentDoc: { $arrayElemAt: ["$stu", 0] },
            jobDoc:     { $arrayElemAt: ["$jobDoc", 0] },
            compDoc:    { $arrayElemAt: ["$compDoc", 0] },
            firstAns:   { $arrayElemAt: ["$answers", 0] },
          },
        },
        {
          $addFields: {
            studentName: {
              $let: {
                vars: { s: "$studentDoc" },
                in: {
                  $ifNull: [
                    "$$s.fullname",
                    {
                      $ifNull: [
                        "$$s.fullName",
                        {
                          $trim: {
                            input: {
                              $concat: [
                                { $ifNull: ["$$s.firstName", ""] },
                                " ",
                                { $ifNull: ["$$s.lastName", ""] },
                              ],
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
            jobTitle: { $ifNull: ["$jobDoc.title", ""] },
            companyName: { $ifNull: ["$companyName", { $ifNull: ["$compDoc.companyName", ""] }] },
            purposeFinal: { $ifNull: ["$purpose", { $ifNull: ["$firstAns.purpose", ""] }] },
          },
        },
        {
          $project: {
            _id: 1,
            student: 1,
            job: 1,
            status: 1,
            resume: 1,
            message: 1,
            purposeDetail: 1,
            studentName: 1,
            jobTitle: 1,
            companyName: 1,
            purpose: "$purposeFinal",
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]);

      return rows.map((a) => ({
        id: String(a._id),
        studentId: a.student ? String(a.student) : "",
        studentName: a.studentName || "",
        jobId: a.job ? String(a.job) : "",
        jobTitle: a.jobTitle || "",
        companyName: a.companyName || "",
        status: a.status || "",
        purpose: a.purpose || "",
        purposeDetail: a.purposeDetail || "",
        resume: a.resume || "",
        message: a.message || "",
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      }));
    },
  },
};

export const exportData = async (req, res) => {
  try {
    const format = String(req.query.format || "csv").toLowerCase(); // csv|xlsx
    const wanted = Array.isArray(req.body?.collections) ? req.body.collections : [];
    const cols = wanted.filter((k) => MAP[k]);
    if (!cols.length) return res.status(400).json({ message: "No collections selected" });

    const datasets = [];
    for (const k of cols) {
      const rows = await MAP[k].fetch();
      datasets.push({ key: k, label: MAP[k].label, rows });
    }

    const t = new Date();
    const stamp =
      `${t.getFullYear()}${String(t.getMonth() + 1).padStart(2, "0")}${String(t.getDate()).padStart(2, "0")}_` +
      `${String(t.getHours()).padStart(2, "0")}${String(t.getMinutes()).padStart(2, "0")}`;

    if (format === "xlsx") {
      const wb = new ExcelJS.Workbook();
      datasets.forEach(({ label, rows }) => {
        const ws = wb.addWorksheet(label);
        if (rows.length) {
          ws.columns = Object.keys(rows[0]).map((h) => ({ header: h, key: h }));
          rows.forEach((r) => ws.addRow(r));
          ws.columns.forEach((c) => (c.width = Math.min(Math.max(10, String(c.header).length + 2), 40)));
        } else {
          ws.addRow(["No data"]);
        }
      });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="internconnect_export_${stamp}.xlsx"`);
      await wb.xlsx.write(res);
      return res.end();
    }

    // CSV
    if (datasets.length === 1) {
      const { key, rows } = datasets[0];
      const csv = rows.length ? new Json2Csv({}).parse(rows) : "";
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="internconnect_${key}_${stamp}.csv"`);
      return res.status(200).send(csv);
    }

    // ZIP of multiple CSVs
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="internconnect_export_${stamp}.zip"`);
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => { throw err; });
    archive.pipe(res);
    for (const { key, rows } of datasets) {
      const csv = rows.length ? new Json2Csv({}).parse(rows) : "";
      archive.append(csv, { name: `internconnect_${key}.csv` });
    }
    await archive.finalize();
  } catch (err) {
    console.error("exportData error:", err);
    res.status(500).json({ message: "Failed to export data" });
  }
};
