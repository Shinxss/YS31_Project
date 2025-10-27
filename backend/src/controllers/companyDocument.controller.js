// controllers/companyDocument.controller.js
import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads/company-docs directory exists
const COMPANY_DOCS_DIR = path.join(process.cwd(), "uploads", "company-docs");
try {
  fs.mkdirSync(COMPANY_DOCS_DIR, { recursive: true });
} catch { /* no-op */ }

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, COMPANY_DOCS_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, "_");
    const userId = req.body.email || "pending";
    const timestamp = Date.now();
    cb(null, `${userId}-${timestamp}-${safe}`);
  },
});

// Accept PDF/DOC/DOCX up to 10MB
const fileFilter = (_req, file, cb) => {
  const okMime = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);
  const okExt = /\.(pdf|docx?)$/i.test(file.originalname);
  if (okMime.has(file.mimetype) || okExt) return cb(null, true);
  return cb(new Error("Only PDF, DOC, or DOCX files are allowed"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const uploadCompanyDocuments = upload.fields([
  { name: "legalDocs", maxCount: 10 },
  { name: "taxDocs", maxCount: 10 },
]);

/**
 * POST /api/auth/upload-company-docs
 * Uploads company verification documents
 */
export const handleUpload = async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const legalDocs = (req.files.legalDocs || []).map((file) => file.filename);
    const taxDocs = (req.files.taxDocs || []).map((file) => file.filename);

    return res.json({
      message: "Documents uploaded successfully",
      legalDocs,
      taxDocs,
    });
  } catch (err) {
    console.error("Document upload error:", err);
    return res.status(400).json({ message: err.message || "Failed to upload documents" });
  }
};


