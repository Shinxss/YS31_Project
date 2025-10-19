import express from "express";
import {
  getStudentProfile,
  updateStudentProfile,
  addReminder,
  getReminders,
} from "../controllers/student.controller.js";
import { protect } from "../middlewares/auth.js"; 
import { 
  listMyApplications,
  uploadResume, 
  applyToJob } from "../controllers/Applications.controller.js";

const router = express.Router();

// Get student profile
router.get("/me", protect, getStudentProfile);

// Update student profile
router.put("/profile", protect, updateStudentProfile);
router.post("/reminders", protect, addReminder);
router.get("/reminders", protect, getReminders);

// order matters: protect → uploadResume → applyToJob
router.post("/apply", protect, uploadResume, applyToJob);
router.get("/applications", protect, listMyApplications);

export default router;
