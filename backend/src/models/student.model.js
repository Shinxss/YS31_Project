import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    email:     { type: String, required: true, unique: true, index: true },
    password:  { type: String, required: true }, // hashed
    school:    { type: String, required: true },
    course:    { type: String, required: true },
    major:     { type: String },
    applications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Application" }],

    // ✅ Added fields for profile
    profilePicture: { type: String, default: "" }, // Base64 or URL
    bio: { type: String, default: "" },
    skills: [{ type: String, default: [] }],

    // ✅ Basic info section
    age: { type: Number, default: null },
    location: { type: String, default: "" },
    contactNumber: { type: String, default: "" },
    gender: { type: String, enum: ["Male", "Female", "Other", ""], default: "" },
    race: { type: String, default: "" },

    // ✅ Tabs section
    experience: { type: String, default: "" },
    education: { type: String, default: "" },
    certification: { type: String, default: "" },
  },
  { timestamps: true, collection: "student_users" }
);

// Existing user reference
studentSchema.add({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
});

// Keep your existing logic below
if (studentSchema.path("password")) {
  studentSchema.path("password").required(false); 
}

studentSchema.pre("save", function (next) {
  if (this.isModified("email") && typeof this.email === "string") {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

studentSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

export default mongoose.model("Student", studentSchema);
