import express from "express";
import auth from "../middlewares/auth.js";          // <-- include .js extension
import * as companyController from "../controllers/company.controller.js";

const router = express.Router();

router.get("/me", auth, companyController.getMe);

export default router;
