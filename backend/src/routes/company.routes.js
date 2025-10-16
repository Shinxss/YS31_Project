import express from "express";
import auth from "../middlewares/auth.js";
import {
  getMe,
  validateCompanyName,
  saveCompanyDetails,
  getCompanyDetails,
} from "../controllers/company.controller.js"; // ✅ removed uploadCompanyImages

const router = express.Router();

// 🧩 Routes
router.get("/me", auth, getMe);
router.get("/validate-name", validateCompanyName);

// ✅ Simplified: no multer upload needed (uses base64 upload now)
router.post("/details/save", auth, saveCompanyDetails);

router.get("/details/:userId", auth, getCompanyDetails);

export default router; // ✅ essential export