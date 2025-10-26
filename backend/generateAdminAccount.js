// backend/generateAdminAccount.js (ESM script)
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// load .env (prefer backend/.env then project root)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const hereEnv = path.resolve(__dirname, ".env");
const rootEnv = path.resolve(__dirname, "..", ".env");

if (fs.existsSync(hereEnv)) dotenv.config({ path: hereEnv });
else if (fs.existsSync(rootEnv)) dotenv.config({ path: rootEnv });
else dotenv.config();

import Admin from "./src/models/Admin.js"; // ensure relative path matches

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/internconnect";
const ADMIN_NAME = process.env.ADMIN_NAME || "System Admin";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@internconnect.com").toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin12345";
const ADMIN_ROLE = process.env.ADMIN_ROLE || "admin";

const main = async () => {
  try {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error("❌ Set ADMIN_EMAIL and ADMIN_PASSWORD in .env");
      process.exit(1);
    }

    console.log("⏳ Connecting to", MONGO_URI);
    await mongoose.connect(MONGO_URI, {});

    const existing = await Admin.findOne({ email: ADMIN_EMAIL }).lean();
    if (existing) {
      console.log("ℹ️ Admin already exists:", {
        id: existing._id?.toString?.() || existing._id,
        email: existing.email,
        name: existing.name,
        role: existing.role,
      });
      process.exit(0);
    }

    // Use Admin.create so pre('save') runs and password is hashed
    const admin = await Admin.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: ADMIN_ROLE,
      status: "active",
    });

    console.log("🎉 Admin created:", {
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
      status: admin.status,
    });

    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to generate admin account:", err?.message || err);
    process.exit(1);
  }
};

main();
