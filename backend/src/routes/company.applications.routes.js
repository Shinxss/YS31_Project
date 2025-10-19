// src/routes/company.applications.routes.js
import express from "express";
import auth, { requireRole } from "../middlewares/auth.js";
import { listCompanyApplications } from "../controllers/companyApplications.controller.js";

const router = express.Router();

// Company-side: list applications for jobs owned by the company
router.get("/applications", auth, requireRole("company"), listCompanyApplications);

export default router;
