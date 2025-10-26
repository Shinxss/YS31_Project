// backend/routes/admin.routes.js
import express from "express";
import { login, me } from "../controllers/admin.controller.js";
import { requireAuth } from "../middlewares/AdminAuth.js";

const router = express.Router();

// Public
router.post("/login", login);

// Protected
router.get("/me", requireAuth, me);

export default router;
