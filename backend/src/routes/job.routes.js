import express from "express";
import auth from "../middlewares/auth.js";
import { createJob, myJobs } from "../controllers/job.controller.js";

const router = express.Router();

import { getAllJobs } from "../controllers/job.controller.js";
import { getJobById } from "../controllers/job.controller.js";
import { getScreeningQuestions } from "../controllers/job.controller.js";

router.get("/", getAllJobs);
router.post("/", auth, createJob);
router.get("/mine", auth, myJobs);
router.get("/:jobId/screening", getScreeningQuestions);
router.get("/:id", getJobById);

export default router;