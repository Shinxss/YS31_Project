import express from "express";
import { 
    publicStats, 
    getMonthlyApplications, } from "../controllers/stats.controller.js";

const router = express.Router();

router.get("/public", publicStats);

router.get("/applications/monthly", /* requireAdminAuth, */ getMonthlyApplications);


export default router;
