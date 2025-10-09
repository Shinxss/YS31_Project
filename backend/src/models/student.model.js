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
  },
  { timestamps: true, collection: "student_users" }
);

studentSchema.add({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
});

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
