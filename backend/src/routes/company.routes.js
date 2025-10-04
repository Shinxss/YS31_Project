import express from "express";
import auth from "../middlewares/auth.js";
import { getMe, validateCompanyName } from "../controllers/company.controller.js";

const router = express.Router();
router.get("/me", auth, getMe);
router.get("/validate-name", validateCompanyName);

export default router;
