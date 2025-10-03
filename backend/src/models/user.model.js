import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true }, // hashed
    role: { type: String, enum: ["student", "company"], required: true },
    status: { type: String, enum: ["active", "pending", "disabled"], default: "active" },
  },
  { timestamps: true, collection: "users" }
);

export default mongoose.model("User", userSchema);
