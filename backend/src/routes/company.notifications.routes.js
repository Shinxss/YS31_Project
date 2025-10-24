// src/routes/company.notifications.routes.js
import express from "express";
import auth, { requireRole } from "../middlewares/auth.js";
import {
  listNotifications,
  markAllRead,
  markOneRead,
} from "../controllers/companyNotifications.controller.js";

const router = express.Router();
router.get("/notifications", auth, requireRole("company"), listNotifications);
router.post("/notifications/mark-all-read", auth, requireRole("company"), markAllRead);
router.post("/notifications/:id/read", auth, requireRole("company"), markOneRead);

export default router;
