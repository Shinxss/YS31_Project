import express from "express";
import Student from "../models/student.model.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// ✅ GET /api/student/me – fetch logged-in student profile
router.get("/me", auth, async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.user.email }).select(
      "firstName lastName email school course major profilePicture bio skills age location contactNumber gender race experience education certification"
    );
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ student });
  } catch (err) {
    console.error("Error fetching student profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ PUT /api/student/profile – update student profile fields
router.put("/profile", auth, async (req, res) => {
  try {
    const updates = {
      bio: req.body.bio,
      skills: req.body.skills,
      age: req.body.age,
      location: req.body.location,
      contactNumber: req.body.contactNumber,
      gender: req.body.gender,
      race: req.body.race,
      experience: req.body.experience,
      education: req.body.education,
      certification: req.body.certification,
      profilePicture: req.body.profilePicture,
      course: req.body.course, // ✅ Added here
    };

    const student = await Student.findOneAndUpdate(
      { email: req.user.email },
      { $set: updates },
      { new: true, runValidators: true }
    ).select(
      "firstName lastName email school course profilePicture bio skills age location contactNumber gender race experience education certification"
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({
      message: "Profile updated successfully",
      student,
    });
  } catch (err) {
    console.error("Error updating student profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
