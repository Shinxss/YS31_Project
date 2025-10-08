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

// ADD >>> link to User and relax password requirement
companySchema.add({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
});

if (companySchema.path("password")) {
  companySchema.path("password").required(false); // password stored in User; keep field optional for back-compat
}

// normalize fields & hide password in JSON
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
// ADD <<<

export default mongoose.model("Company", companySchema);
