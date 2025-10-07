import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    firstName:   { type: String, required: true },
    lastName:    { type: String, required: true },
    role:        { type: String, required: true }, // Owner/Recruiter/etc
    email:       { type: String, required: true, unique: true, index: true },
    password:    { type: String, required: true }, // hashed
    industry:    { type: String, required: true },
    location:    { type: String },
    companyDescription: { type: String }, 
  },
  { timestamps: true, collection: "company_users" }
);

export default mongoose.model("Company", companySchema);
