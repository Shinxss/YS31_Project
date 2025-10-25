// controllers/admin.export.controller.js
import Student from "../models/student.model.js";
import Company from "../models/company.model.js";
import Job from "../models/job.model.js";
import Application from "../models/Application.model.js";
import { Parser as Json2Csv } from "json2csv";
import ExcelJS from "exceljs";
import archiver from "archiver";

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
    label: "Companies",
    fetch: async () =>
      (await Company.find().lean()).map((c) => ({
        id: String(c._id),
        companyName: c.companyName || c.name || "",
        email: c.email || c.contactEmail || "",
        city: c.city || "",
        province: c.province || "",
        location: c.location || "",
        industry: c.industry || "",
        status: c.status || "active",
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
  },
  jobs: {
    label: "Job Listings",
    fetch: async () =>
      (await Job.find().lean()).map((j) => ({
        id: String(j._id),
        title: j.title || "",
        companyId: j.companyId ? String(j.companyId) : "",
        location: j.location || "",
        field: j.field || "",
        type: j.type || "",
        status: j.status || "",
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
      })),
  },
  applications: {
    label: "Applications",
    fetch: async () =>
      (await Application.find().lean()).map((a) => ({
        id: String(a._id),
        studentId: a.studentId ? String(a.studentId) : "",
        jobId: a.jobId ? String(a.jobId) : "",
        status: a.status || "",
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      })),
  },
};

export const exportData = async (req, res) => {
  try {
    const format = String(req.query.format || "csv").toLowerCase(); // csv|xlsx
    const wanted = Array.isArray(req.body?.collections) ? req.body.collections : [];
    const cols = wanted.filter((k) => MAP[k]);

    if (!cols.length) {
      return res.status(400).json({ message: "No collections selected" });
    }

    // Fetch data
    const datasets = [];
    for (const k of cols) {
      const rows = await MAP[k].fetch();
      datasets.push({ key: k, label: MAP[k].label, rows });
    }

    const time = new Date();
    const stamp = `${time.getFullYear()}${String(time.getMonth()+1).padStart(2,"0")}${String(
      time.getDate()
    ).padStart(2,"0")}_${String(time.getHours()).padStart(2,"0")}${String(
      time.getMinutes()
    ).padStart(2,"0")}`;

    if (format === "xlsx") {
      // One workbook, one sheet per collection
      const wb = new ExcelJS.Workbook();
      datasets.forEach(({ label, rows }) => {
        const ws = wb.addWorksheet(label);
        if (rows.length) {
          ws.columns = Object.keys(rows[0]).map((h) => ({ header: h, key: h }));
          rows.forEach((r) => ws.addRow(r));
          ws.columns.forEach((c) => (c.width = Math.min(Math.max(10, (c.header || "").length + 2), 40)));
        } else {
          ws.addRow(["No data"]);
        }
      });
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
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

    // Multiple CSVs -> zip
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
    return res.status(500).json({ message: "Failed to export data" });
  }
};
