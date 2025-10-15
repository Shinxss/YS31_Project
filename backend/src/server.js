import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";

// ==================== ROUTES ====================
import authRoutes from "./routes/auth.routes.js";
import companyRoutes from "./routes/company/company.routes.js";
import jobRoutes from "./routes/job.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import studentRoutes from "./routes/students/studentRoutes.js";

const app = express();

// ==================== MIDDLEWARES ====================
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" })); // ⬆️ increased for base64 images
app.use(morgan("dev"));

// ==================== STATIC DIRECTORIES ====================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// upload folders
const UPLOADS_DIR = path.join(__dirname, "../uploads");
const UPLOADS_COMPANY_DIR = path.join(__dirname, "../uploads/company");
const PUBLIC_UPLOADS_DIR = path.join(__dirname, "../public/uploads");

// mount helper
function mountStatic(urlPath, dirPath) {
  const exists = fs.existsSync(dirPath);
  console.log(`🔎 Checking ${urlPath} -> ${dirPath}  exists=${exists}`);
  if (exists) {
    app.use(urlPath, express.static(dirPath));
    console.log(`🖼️ Serving ${urlPath} from: ${dirPath}`);
  } else {
    console.log(`⚠️ Skipping ${urlPath} (not found): ${dirPath}`);
  }
}

// mount directories
mountStatic("/uploads", UPLOADS_DIR);
mountStatic("/uploads/company", UPLOADS_COMPANY_DIR);
mountStatic("/uploads/public", PUBLIC_UPLOADS_DIR);

// debug route
app.get("/__debug/paths", (_req, res) => {
  const ls = (p) => (fs.existsSync(p) ? fs.readdirSync(p) : null);
  res.json({
    __dirname,
    uploads: { path: UPLOADS_DIR, files: ls(UPLOADS_DIR) },
    uploads_company: { path: UPLOADS_COMPANY_DIR, files: ls(UPLOADS_COMPANY_DIR) },
    public_uploads: { path: PUBLIC_UPLOADS_DIR, files: ls(PUBLIC_UPLOADS_DIR) },
  });
});

// ==================== ROUTES MOUNTING ====================
app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
console.log("✅ /api/company routes mounted successfully!");

app.use("/api/jobs", jobRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/student", studentRoutes);

// health check
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, app: process.env.APP_NAME || "InternConnect Backend" })
);

// 404 fallback
app.use((req, res) => res.status(404).json({ message: "Not found" }));

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/internconnect";

connectDB(MONGO_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
