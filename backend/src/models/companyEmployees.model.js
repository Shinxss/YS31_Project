import mongoose from "mongoose";

const PersonSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    role:      { type: String, default: "Owner", trim: true },
  },
  { _id: false }
);

const CompanyEmployeesSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    owner: { type: PersonSchema, required: true },
    employees: { type: [PersonSchema], default: [] },
  },
  { timestamps: true }
);

CompanyEmployeesSchema.index(
  { companyName: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

// ADD >>> convenience helper for case-insensitive lookups
CompanyEmployeesSchema.statics.findByNameCi = function (companyName) {
  return this.findOne({ companyName }, null, { collation: { locale: "en", strength: 2 } });
};
// ADD <<<

export default mongoose.model("CompanyEmployees", CompanyEmployeesSchema);
