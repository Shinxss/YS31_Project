import express from "express";
import Student from "../models/student.model.js";
import auth from "../middlewares/auth.js";


const router = express.Router();

// GET /api/student/me – fetch logged in student profile
router.get("/me", auth, async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.user.email }).select(
      "firstName lastName course email"
    );
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
export default router;
