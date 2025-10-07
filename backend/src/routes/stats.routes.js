import express from "express";
import { publicStats } from "../controllers/stats.controller.js";

const router = express.Router();

router.get("/public", publicStats);

export default router;
