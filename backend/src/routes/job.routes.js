import express from "express";
import auth from "../middlewares/auth.js";
import {
  createJob,
  myJobs,
  getAllJobs,
  getJobById,
  getScreeningQuestions, 
} from "../controllers/students/job.controller.js"; 

const router = express.Router();
router.get("/", getAllJobs);
router.get("/:jobId", getJobById);
router.get("/:jobId/screening", getScreeningQuestions);

router.post("/", auth, createJob);
router.get("/mine", auth, myJobs);

export default router;
