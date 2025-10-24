import express from "express";
import auth, {requireRole} from "../middlewares/auth.js";
import { listCompanyApplications } from "../controllers/companyApplications.controller.js"
import { listMyCompanyJobs } from "../controllers/job.controller.js";
import {
  getMe,
  validateCompanyName,
  saveCompanyDetails,
  getCompanyDetails,
} from "../controllers/company.controller.js";


const router = express.Router();

// 🧩 Routes
router.get("/me", auth, getMe);
router.use(auth, requireRole("company"));
router.get("/validate-name", validateCompanyName);


router.post("/details/save", auth, saveCompanyDetails);
router.get("/details/:userId", auth, getCompanyDetails);


router.get("/applications", auth, listCompanyApplications);
router.get("/jobs", auth, listMyCompanyJobs);


export default router; // ✅ essential export