// src/routes/company.applications.routes.js
import express from "express";
import auth, { requireRole } from "../middlewares/auth.js";
import { 
    listCompanyApplications, 
    getCompanyApplication, 
} from "../controllers/companyApplications.controller.js";

const router = express.Router();

// Company-side: list applications for jobs owned by the company
router.get("/applications", auth, requireRole("company"), listCompanyApplications);
router.get("/applications/:id", auth, requireRole("company"), getCompanyApplication);

export default router;
