import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import path from "path";
import { fileURLToPath } from "url";

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
    // ✅ ADDED: allow Authorization header for your /api/jobs/:jobId/screening (when protected) and uploads
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Type"],
  })
);

// ✅ ADDED: also parse urlencoded (for robustness with some form posts)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" })); // ADDED
app.use(morgan("dev"));

// ✅ serve uploaded images BEFORE routes
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ✅ OPTIONAL: serve resumes folder, if you store files like /uploads/resumes (safe, additive)
app.use("/uploads/resumes", express.static(path.join(__dirname, "../uploads/resumes"))); // ADDED (safe)

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/student", studentRoutes);

// Health
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, app: process.env.APP_NAME || "App" })
);

// ✅ ADDED: quick root check to confirm server is running
app.get("/", (_req, res) => res.send("InternConnect API is running.")); // ADDED

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
