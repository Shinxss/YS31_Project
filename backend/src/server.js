// backend/src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";

// routes
import authRoutes from "./routes/auth.routes.js";
import companyRoutes from "./routes/company.routes.js";
import jobRoutes from "./routes/job.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import studentRoutes from "./routes/studentRoutes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// ------------------ STATIC MOUNTS (with logs) ------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve candidate paths relative to THIS file (backend/src/server.js)
const UPLOADS_DIR = path.join(__dirname, "../uploads");                 // backend/uploads
const UPLOADS_COMPANY_DIR = path.join(__dirname, "../uploads_company"); // backend/uploads_company
const PUBLIC_UPLOADS_DIR = path.join(__dirname, "../public/uploads");   // backend/public/uploads

// helper: mount if exists and log path
function mountStatic(urlPath, dirPath) {
  const exists = fs.existsSync(dirPath);
  console.log(`🔎 Checking ${urlPath} -> ${dirPath}  exists=${exists}`);
  if (exists) {
    app.use(urlPath, express.static(dirPath));
    console.log(`🖼️  Serving ${urlPath} from: ${dirPath}`);
  } else {
    console.log(`⚠️  Skipping ${urlPath} (not found): ${dirPath}`);
  }
}

// mount both
mountStatic("/uploads", UPLOADS_DIR);
mountStatic("/uploads_company", UPLOADS_COMPANY_DIR);
mountStatic("/uploads/public", PUBLIC_UPLOADS_DIR); // optional extra

// Debug: show what Express thinks __dirname is and list files
app.get("/__debug/paths", (_req, res) => {
  const ls = (p) => (fs.existsSync(p) ? fs.readdirSync(p) : null);
  res.json({
    __dirname,
    uploads: { path: UPLOADS_DIR, files: ls(UPLOADS_DIR) },
    uploads_company: { path: UPLOADS_COMPANY_DIR, files: ls(UPLOADS_COMPANY_DIR) },
    public_uploads: { path: PUBLIC_UPLOADS_DIR, files: ls(PUBLIC_UPLOADS_DIR) },
  });
});
// ---------------------------------------------------------------

app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/student", studentRoutes);

app.get("/api/health", (_req, res) =>
  res.json({ ok: true, app: process.env.APP_NAME || "App" })
);

// 404
app.use((req, res) => res.status(404).json({ message: "Not found" }));

const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/internconnect";

connectDB(MONGO_URI).then(() => {
  app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  );
});
