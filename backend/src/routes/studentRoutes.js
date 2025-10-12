import express from "express";
import {
  getStudentProfile,
  updateStudentProfile,
  addReminder,
  getReminders,
} from "../controllers/student.controller.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

// Get student profile
router.get("/me", protect, getStudentProfile);

// Update student profile
router.put("/profile", protect, updateStudentProfile);

// Add and fetch reminders
router.post("/reminders", protect, addReminder);
router.get("/reminders", protect, getReminders);

export default router;
