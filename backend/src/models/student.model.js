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
  { timestamps: true, collection: "students_users" }
);

export default mongoose.model("Student", studentSchema);
