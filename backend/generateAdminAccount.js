// backend/generateAdminAccount.js (ESM)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config as dotenv } from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prefer backend/.env; fall back to project root .env
const hereEnv = path.resolve(__dirname, ".env");
const rootEnv = path.resolve(__dirname, "..", ".env");
if (fs.existsSync(hereEnv)) dotenv({ path: hereEnv });
else if (fs.existsSync(rootEnv)) dotenv({ path: rootEnv });
else dotenv();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/internconnect";
const ADMIN_NAME = process.env.ADMIN_NAME || "System Admin";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@12345";
const ADMIN_ROLE = process.env.ADMIN_ROLE || "admin";

const AdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ["admin", "superadmin"], default: "admin" },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
  },
  { timestamps: true, collection: "admin" }
);

AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);

try {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("❌ Set ADMIN_EMAIL and ADMIN_PASSWORD in .env");
    process.exit(1);
  }

  console.log("⏳ Connecting to", MONGO_URI);
  await mongoose.connect(MONGO_URI);

  const exists = await Admin.findOne({ email: ADMIN_EMAIL });
  if (exists) {
    console.log("ℹ️ Admin already exists:", {
      id: exists._id.toString(),
      email: exists.email,
      name: exists.name,
      role: exists.role,
    });
    process.exit(0);
  }

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
  console.error("❌ Failed:", err.message);
  process.exit(1);
}
