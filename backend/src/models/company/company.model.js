import mongoose from "mongoose";
import CompanyEmployees from "./companyEmployees.model.js";

const companySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, required: true }, // Owner/Recruiter/etc
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: false }, // stored in User; keep optional

    // ✅ required if Owner
    industry: {
      type: String,
      required: function () {
        return this.role === "Owner";
      },
      trim: true,
    },

    location: { type: String },
    companyDescription: { type: String },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  },
  { timestamps: true, collection: "company_users" }
);

// ✅ Normalize data
companySchema.pre("save", function (next) {
  if (this.isModified("email") && typeof this.email === "string") {
    this.email = this.email.toLowerCase().trim();
  }
  if (this.isModified("companyName") && typeof this.companyName === "string") {
    this.companyName = this.companyName.trim();
  }
  next();
});

// ✅ Optional: Sync industry and company details to company_employees
companySchema.post("save", async function (doc) {
  try {
    const existing = await CompanyEmployees.findByNameCi(doc.companyName);

    if (!existing) {
      await CompanyEmployees.create({
        companyName: doc.companyName,
        owner: {
          email: doc.email,
          firstName: doc.firstName,
          lastName: doc.lastName,
          role: doc.role,
        },
        industry: doc.industry || "",
        email: doc.email,
        userId: doc.user,
      });
    } else if (doc.industry && existing.industry !== doc.industry) {
      existing.industry = doc.industry;
      await existing.save();
    }
  } catch (err) {
    console.error("Failed to sync company to company_employees:", err);
  }
});

companySchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

export default mongoose.model("Company", companySchema);
