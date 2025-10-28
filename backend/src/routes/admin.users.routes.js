// routes/admin.users.routes.js
import { Router } from "express";
import {
  listStudents,
  listCompanies,
  setStudentStatus,
  setCompanyStatus,
  setCompanyVerification,
  getCompanyDetails,
} from "../controllers/admin.users.controller.js";
import {
  getAdminNotifications,
  markNotificationAsRead,
  deleteNotification,
} from "../controllers/admin.notifications.controller.js";

// If you have admin auth middleware, import it here:
// import { requireAdmin } from "../middlewares/auth.js";
// then add it to each route as the first param.

const router = Router();

router.get("/students", /* requireAdmin, */ listStudents);
router.get("/companies", /* requireAdmin, */ listCompanies);

router.patch("/students/:id/status", /* requireAdmin, */ setStudentStatus);
router.patch("/companies/:id/status", /* requireAdmin, */ setCompanyStatus);
router.patch("/companies/:id/verify", /* requireAdmin, */ setCompanyVerification);
router.get("/companies/:id", /* requireAdmin, */ getCompanyDetails);

// Notification routes
router.get("/notifications", /* requireAdmin, */ getAdminNotifications);
router.patch("/notifications/:id/read", /* requireAdmin, */ markNotificationAsRead);
router.delete("/notifications/:id", /* requireAdmin, */ deleteNotification);

export default router;
