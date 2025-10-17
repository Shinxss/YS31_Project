import express from "express";
import auth from "../middlewares/auth.js";
import {
  createJob,
  myJobs,
  getAllJobs,
  getJobById,
  getScreeningQuestions,
  getRandomJob, // ✅ added
} from "../controllers/job.controller.js";

const router = express.Router();

// ✅ NEW: Random job route (public)
router.get("/random", getRandomJob);

router.get("/", getAllJobs);
router.post("/", auth, createJob);
router.get("/mine", auth, myJobs);
router.get("/:jobId/screening", getScreeningQuestions);
router.get("/:id", getJobById);

export default router;
