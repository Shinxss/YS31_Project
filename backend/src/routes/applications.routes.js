// src/routes/applications.routes.js
import express from "express";
import auth, { requireRole } from "../middlewares/auth.js"; // ← ensure this path matches your project

import { 
  uploadResume, 
  applyToJob,
  updateApplicationStatus  } from "../controllers/Applications.controller.js";
  

const router = express.Router();

router.patch("/applications/:id", auth, updateApplicationStatus);

router.post(
  "/student/apply/:jobId",
  auth,
  requireRole("student"),
  uploadResume,
  applyToJob
);

router.post(
  "/student/apply",
  auth,
  requireRole("student"),
  uploadResume,
  applyToJob
);

export default router;
