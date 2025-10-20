// src/routes/applications.routes.js
import express from "express";
import auth, { requireRole } from "../middlewares/auth.js"; 

import { 
  uploadResume, 
  applyToJob,
  updateApplicationStatus, 
  getScreeningAnswers, 
  getApplicantMessage } from "../controllers/Applications.controller.js";
  

const router = express.Router();

router.patch("/applications/:id", auth, updateApplicationStatus);

router.post("/student/apply/:jobId", auth, requireRole("student"), uploadResume, applyToJob);
router.post("/student/apply", auth, requireRole("student"), uploadResume, applyToJob);



router.get("/applications/:id/screening-answers", auth, getScreeningAnswers);
router.get("/applications/:id/message", auth, getApplicantMessage);

export default router;
