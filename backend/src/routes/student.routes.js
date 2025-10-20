import express from "express";
import auth from "../middlewares/auth.js";
import { protect } from "../middlewares/auth.js";
  
import {
  getStudentProfile,
  updateStudentProfile,
  addReminder,
  getReminders,
  getStudentPublicProfile,
  updateReminder,
  deleteReminder
} from "../controllers/student.controller.js";
 
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
router.patch("/students/me/reminders/:reminderId", protect, updateReminder);
router.delete("/students/me/reminders/:reminderId", protect, deleteReminder);

// order matters: protect → uploadResume → applyToJob
router.post("/apply", protect, uploadResume, applyToJob);
router.get("/applications", protect, listMyApplications);
router.get(["/:id/profile", "/:id/public"], auth, getStudentPublicProfile);

export default router;
