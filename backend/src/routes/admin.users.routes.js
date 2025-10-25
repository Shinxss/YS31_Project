// routes/admin.users.routes.js
import { Router } from "express";
import {
  listStudents,
  listCompanies,
  setStudentStatus,
  setCompanyStatus,
} from "../controllers/admin.users.controller.js";

// If you have admin auth middleware, import it here:
// import { requireAdmin } from "../middlewares/auth.js";
// then add it to each route as the first param.

const router = Router();

router.get("/students", /* requireAdmin, */ listStudents);
router.get("/companies", /* requireAdmin, */ listCompanies);

router.patch("/students/:id/status", /* requireAdmin, */ setStudentStatus);
router.patch("/companies/:id/status", /* requireAdmin, */ setCompanyStatus);

export default router;
