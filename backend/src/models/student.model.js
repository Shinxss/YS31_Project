import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true }, // hashed

    // Removed school & major
    course: { type: String, required: true },

    applications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Application" }],

    // Profile and personal info
    profilePicture: { type: String, default: "" },
    bio: { type: String, default: "" },
    skills: [{ type: String, default: [] }],

    age: { type: Number, default: null },
    location: { type: String, default: "" },
    contactNumber: { type: String, default: "" },
    gender: { type: String, enum: ["Male", "Female", "Other", ""], default: "" },
    race: { type: String, default: "" },

    // Experience section
    experience: [
      {
        jobTitle: { type: String, required: true },
        jobType: {
          type: String,
          enum: ["Full-time", "Part-time", "Intern", "Contract"],
          default: "Full-time",
        },
        workType: {
          type: String,
          enum: ["On-site", "Remote", "Hybrid"],
          default: "On-site",
        },
        companyName: { type: String, required: true },
        location: { type: String, default: "" },
        startDate: { type: String, required: true },
        endDate: { type: String, default: "" },
      },
    ],

    // Education section (school kept only here for education history)
    education: [
      {
        school: { type: String, required: true },
        degree: { type: String, required: true },
        startDate: { type: String, required: true },
        endDate: { type: String, default: "" },
      },
    ],

    // Certification section
    certification: [
      {
        title: { type: String, required: true },
        companyName: { type: String, required: true },
        dateReceived: { type: String, required: true },
      },
    ],
  },
  { timestamps: true, collection: "student_users" } // ✅ Ensures this model maps to student_users
);

// Reminders / Schedule section
studentSchema.add({
  reminders: [
    {
      title: { type: String, required: true },
      description: { type: String, default: "" },
      date: { type: String, required: true },
      time: { type: String, required: true },
      type: {
        type: String,
        enum: ["Work", "Interview", "Meeting", "Birthday", "Task", "Other"],
        default: "Other",
      },
    },
  ],
});

// Existing user reference
studentSchema.add({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
});

// Keep password optional for linked-user accounts
if (studentSchema.path("password")) {
  studentSchema.path("password").required(false);
}

// Normalize email before save
studentSchema.pre("save", function (next) {
  if (this.isModified("email") && typeof this.email === "string") {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

// Hide password in responses
studentSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

export default mongoose.model("Student", studentSchema);