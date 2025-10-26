// src/routes/applications.routes.js
import express from "express";
import auth, { requireRole } from "../middlewares/auth.js"; 

import { 
  uploadResume, 
  applyToJob,
  updateApplicationStatus, 
  getScreeningAnswers, 
  getApplicantMessage, 
  getApplicationCounts, 
  getApplicationsSuccessRate,
  deleteMyApplication } from "../controllers/Applications.controller.js";
  

const router = express.Router();

router.patch("/applications/:id", auth, updateApplicationStatus);

router.post("/student/apply/:jobId", auth, requireRole("student"), uploadResume, applyToJob);
router.post("/student/apply", auth, requireRole("student"), uploadResume, applyToJob);



router.get("/applications/:id/screening-answers", auth, getScreeningAnswers);
router.get("/applications/:id/message", auth, getApplicantMessage);
router.get("/applications/stats", getApplicationCounts);
router.get("/success-rate", getApplicationsSuccessRate);
router.delete("/student/applications/:id", auth, deleteMyApplication);

// Works when the router is mounted at /api/applications
router.get("/stats", getApplicationCounts);

export default router;
