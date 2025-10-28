// backend/src/routes/admin.jobListings.routes.js
import express from "express";
import { getAllJobs, deleteJob } from "../controllers/admin.jobListings.controller.js";

const router = express.Router();

router.get("/", getAllJobs);
router.delete("/:id", deleteJob);

export default router;
    