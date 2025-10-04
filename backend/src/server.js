// backend/src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";

// routes
import authRoutes from "./routes/auth.routes.js";
import companyRoutes from "./routes/company.routes.js"; // <— add this

const app = express();

// --- middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// --- routes
app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes); // <— enable company API

// health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// 404
app.use((req, res) => res.status(404).json({ message: "Not found" }));

// start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/internconnect";

connectDB(MONGO_URI).then(() => {
  app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  );
});
