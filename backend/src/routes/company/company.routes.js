import express from "express";
import auth from "../../middlewares/auth.js";

// ✅ Old controller: signup-related logic
import { validateCompanyName } from "../../controllers/company/company.controller.js";

// ✅ New controller: dashboard/profile logic
import {
  getCompanyProfile,
  updateCompanyProfile,
  getCompanyProfileById,
} from "../../controllers/company/companyProfile.controller.js";

const router = express.Router();

// =======================================================
// 🧩 Company Profile (dashboard/settings)
// =======================================================
router.get("/me", auth, getCompanyProfile);
router.post("/details/save", auth, updateCompanyProfile);
router.get("/details/:userId", auth, getCompanyProfileById);

// =======================================================
// 🧩 Company Registration / Validation
// =======================================================
router.get("/validate-name", validateCompanyName);

export default router;
