import mongoose from "mongoose";

const CompanyEmployeesSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    // optional: slug if you want to add later
    companySlug: { type: String, trim: true },

    // point these refs to your company profile model ("Company") or to "User" if you prefer
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Company" }],
  },
  {
    timestamps: true,
    // ⬇️ force the collection name so we don't accidentally write to a different one
    collection: "companies_employees",
  }
);

// Case-insensitive unique index on companyName
CompanyEmployeesSchema.index(
  { companyName: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

// Optional unique slug (only if you set it)
CompanyEmployeesSchema.index({ companySlug: 1 }, { unique: true, sparse: true });

export default mongoose.model("CompanyEmployees", CompanyEmployeesSchema);
