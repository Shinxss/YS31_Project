import express from "express";
import auth, {requireRole} from "../middlewares/auth.js";
import { listCompanyApplications } from "../controllers/companyApplications.controller.js"
import { listMyCompanyJobs } from "../controllers/job.controller.js";
import {
  getMe,
  validateCompanyName,
  saveCompanyDetails,
  getCompanyDetails,
  updateJob, 
  deleteJob,
  getApplicantsByJobId
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

router.patch("/jobs/:id", auth, updateJob);
router.delete("/jobs/:id", auth, deleteJob);

router.get("/jobs/:jobId/applicants", auth, getApplicantsByJobId); // fetching applicant in jobdetailpage


export default router; // ✅ essential export