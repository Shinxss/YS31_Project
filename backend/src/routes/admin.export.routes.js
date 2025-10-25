// routes/admin.export.routes.js
import { Router } from "express";
import { exportData } from "../controllers/admin.export.controller.js";
// import { requireAdmin } from "../middlewares/auth.js";

const router = Router();
router.post("/", /* requireAdmin, */ exportData);
export default router;
