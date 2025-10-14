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
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// ✅ serve uploaded images BEFORE routes
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/student", studentRoutes);

app.get("/api/health", (_req, res) =>
  res.json({ ok: true, app: process.env.APP_NAME || "App" })
);

app.use((req, res) => res.status(404).json({ message: "Not found" }));

const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/internconnect";

connectDB(MONGO_URI).then(() => {
  app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  );
});
