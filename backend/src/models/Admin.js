// backend/models/Admin.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["admin", "superadmin"], default: "admin" },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
  },
  { timestamps: true, collection: "admins" }
);

// Hash password before save (works with create() and save())
AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Helper instance method to compare password
AdminSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);
export default Admin;
