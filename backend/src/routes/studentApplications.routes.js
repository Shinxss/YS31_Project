// routes/studentApplications.routes.js
import { Router } from "express";
import auth, { protect } from "../middlewares/auth.js";
import {
  listMyApplications,
  getMyApplicationsSummary,
} from "../controllers/studentApplications.controller.js";

const router = Router();

/**
 * GET /api/student/applications
 * Returns the authenticated student's applications (paginated later if needed)
 */
router.get("/", protect || auth, listMyApplications);

/**
 * GET /api/student/applications/summary
 * Returns counts for dashboard cards: total, accepted, rejected, applied, successRate
 */
router.get("/summary", protect || auth, getMyApplicationsSummary);

export default router;
