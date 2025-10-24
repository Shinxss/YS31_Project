// src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";

// ---------- Route modules ----------
import authRoutes from "./routes/auth.routes.js";
import companyRoutes from "./routes/company.routes.js";
import jobRoutes from "./routes/job.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import studentRoutes from "./routes/student.routes.js";
import applicationsRoutes from "./routes/applications.routes.js";
import companyApplicationsRoutes from "./routes/company.applications.routes.js";
import companyNotificationsRoutes from "./routes/company.notifications.routes.js";




// ---------- App ----------
const app = express();

// ---------- Core config ----------
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/internconnect";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";





// ---------- Middleware ----------
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));




// ---------- Static directories ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Point /uploads to the ROOT uploads folder
const UPLOADS_DIR = path.join(__dirname, "../uploads");
// Optional convenience mount that points directly to the company subfolder
const UPLOADS_COMPANY_DIR = path.join(__dirname, "../uploads/company");
const PUBLIC_UPLOADS_DIR = path.join(__dirname, "../public/uploads");

function mountStatic(urlPath, dirPath) {
  if (fs.existsSync(dirPath)) {
    app.use(urlPath, express.static(dirPath));
    console.log(`🖼️  Serving ${urlPath} → ${dirPath}`);
  } else {
    console.log(`⚠️  Skipping ${urlPath} (missing) → ${dirPath}`);
  }
}

// /uploads -> <project>/uploads
mountStatic("/uploads", UPLOADS_DIR);
// /uploads/company -> <project>/uploads/company  (optional, harmless)
mountStatic("/uploads/company", UPLOADS_COMPANY_DIR);
mountStatic("/uploads/public", PUBLIC_UPLOADS_DIR);





// Optional: quick debug route for checking mounts
app.get("/__debug/paths", (_req, res) => {
  const ls = (p) => (fs.existsSync(p) ? fs.readdirSync(p) : null);
  res.json({
    __dirname,
    uploads: { path: UPLOADS_DIR, files: ls(UPLOADS_DIR) },
    uploads_company: { path: UPLOADS_COMPANY_DIR, files: ls(UPLOADS_COMPANY_DIR) },
    public_uploads: { path: PUBLIC_UPLOADS_DIR, files: ls(PUBLIC_UPLOADS_DIR) },
  });
});



// ---------- Routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/stats", statsRoutes);
app.use(["/api/students", "/api/student"], studentRoutes);
app.use("/api", applicationsRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/company", companyApplicationsRoutes);
app.use("/api/company", companyNotificationsRoutes);




// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, app: process.env.APP_NAME || "InternConnect Backend" });
});



// ---------- 404 & error handlers ----------
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});




// ---------- Start ----------
connectDB(MONGO_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🌐 CORS origin: ${CLIENT_ORIGIN}`);
  });
});
