// backend/src/routes/admin.companyApplications.routes.js
import express from "express";
import {
  getPendingCompanies,
  approveCompany,
  rejectCompany,
} from "../controllers/admin.companyApplications.controller.js";

const router = express.Router();

router.get("/", getPendingCompanies);
router.patch("/:id/approve", approveCompany);
router.patch("/:id/reject", rejectCompany);

export default router;
