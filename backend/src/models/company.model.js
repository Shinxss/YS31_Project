import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, required: true }, // Owner/Recruiter/etc
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: false }, // stored in User; keep optional for back-compat

    // ✅ industry only required if role === 'Owner'
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

// normalize & cleanup
companySchema.pre("save", function (next) {
  if (this.isModified("email") && typeof this.email === "string") {
    this.email = this.email.toLowerCase().trim();
  }
  if (this.isModified("companyName") && typeof this.companyName === "string") {
    this.companyName = this.companyName.trim();
  }
  next();
});

companySchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

export default mongoose.model("Company", companySchema);
