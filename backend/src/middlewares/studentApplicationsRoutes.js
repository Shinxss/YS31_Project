// routes/studentApplications.routes.js
import { Router } from "express";
import auth, { protect } from "../middleware/auth.js";
import {
  listMyApplications,
  getMyApplicationsSummary,
  getMyApplicationsThisWeek, // <- make sure this is exported from controller
} from "../controllers/studentApplications.controller.js";

const router = Router();

// Quick sanity check
router.get("/ping", (_req, res) => res.json({ ok: true, scope: "applications" }));

// GET /api/student/applications
router.get("/", protect || auth, listMyApplications);

// GET /api/student/applications/summary
router.get("/summary", protect || auth, getMyApplicationsSummary);

// ✅ GET /api/student/applications/summary/week  (Mon→Sun reset)
router.get("/summary/week", protect || auth, getMyApplicationsThisWeek);

export default router;
