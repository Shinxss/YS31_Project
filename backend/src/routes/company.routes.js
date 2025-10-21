import express from "express";
import auth, {requireRole} from "../middlewares/auth.js";
import {
  getMe,
  validateCompanyName,
  saveCompanyDetails,
  getCompanyDetails,
} from "../controllers/company.controller.js";
import { listCompanyApplications } from "../controllers/companyApplications.controller.js"
import { listMyCompanyJobs } from "../controllers/job.controller.js";

const router = express.Router();

// 🧩 Routes
router.get("/me", auth, getMe);
router.get("/validate-name", validateCompanyName);

// ✅ Simplified: no multer upload needed (uses base64 upload now)
router.post("/details/save", auth, saveCompanyDetails);
router.get("/details/:userId", auth, getCompanyDetails);
router.get("/applications", auth, listCompanyApplications);
router.get("/jobs", auth, listMyCompanyJobs);


export default router; // ✅ essential export