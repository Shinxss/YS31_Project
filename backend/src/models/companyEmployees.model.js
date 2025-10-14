import mongoose from "mongoose";

const PersonSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: { type: String, default: "Owner", trim: true },
  },
  { _id: false }
);

const CompanyEmployeesSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    owner: { type: PersonSchema, required: true },
    employees: { type: [PersonSchema], default: [] },

    // =====================================================
    // 🏢 Company Details Page fields
    // =====================================================
    industry: { type: String, required: true, trim: true }, // ✅ ensure industry is always stored
    description: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    province: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    email: { type: String, trim: true },
    website: { type: String, trim: true },
    companySize: { type: String, trim: true },

    // ✅ link to User collection
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // 🆕 image fields
    coverPhoto: { type: String, trim: true, default: "" },
    profileImage: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

// ✅ make companyName case-insensitive unique
CompanyEmployeesSchema.index(
  { companyName: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

// ✅ utility for case-insensitive find
CompanyEmployeesSchema.statics.findByNameCi = function (companyName) {
  return this.findOne({ companyName }, null, {
    collation: { locale: "en", strength: 2 },
  });
};

export default mongoose.model("company_employees", CompanyEmployeesSchema);
