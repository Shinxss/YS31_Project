// backend/src/routes/job.routes.js
import express from "express";
import auth from "../middlewares/auth.js";
import { createJob, myJobs } from "../controllers/job.controller.js";

const router = express.Router();

// company-only protected endpoints
router.post("/", auth, createJob);
router.get("/mine", auth, myJobs);

export default router;
