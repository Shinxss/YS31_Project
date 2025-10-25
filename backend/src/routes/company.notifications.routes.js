import { Router } from "express";
import {
  createCompanyNotification,
  sendCompanyEmail,
  listCompanyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../controllers/company.notifications.controller.js";
import { protect } from "../middlewares/auth.js";
// import { allowRoles } from "../middlewares/roles.js"; // optional

const router = Router();

// Read/list
router.get(
  "/",
  protect,
  // allowRoles("company", "admin"),
  listCompanyNotifications
);

// Mark all read MUST be before the :id route
router.patch(
  "/read-all",
  protect,
  // allowRoles("company", "admin"),
  markAllNotificationsRead
);

// Mark one as read
router.patch(
  "/:id/read",
  protect,
  // allowRoles("company", "admin"),
  markNotificationRead
);

// Delete one
router.delete(
  "/:id",
  protect,
  // allowRoles("company", "admin"),
  deleteNotification
);

// Existing: create (from student/apply) and email
router.post(
  "/",
  protect, // if you allow students too, replace with allowRoles("student","admin","company")
  createCompanyNotification
);
router.post(
  "/email",
  protect, // allowRoles("student","company","admin"),
  sendCompanyEmail
);

export default router;
