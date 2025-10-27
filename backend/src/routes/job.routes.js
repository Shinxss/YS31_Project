import express from "express";
import auth from "../middlewares/auth.js";

import { 
    createJob,
    myJobs,
    getAllJobs,
    getJobById,
    getJobApplications,
    getScreeningQuestions, 
    listJobs  } from "../controllers/job.controller.js";

const router = express.Router();

router.get("/", getAllJobs);
router.post("/", auth, createJob);
router.get("/mine", auth, myJobs);
router.get("/:jobId/screening", getScreeningQuestions);
router.get("/:id/applications", auth, getJobApplications);
router.get("/:id", getJobById);
router.get("/", listJobs);

export default router;