import express from "express";
import {
  login,
  sendSignupOtp,
  verifySignupOtp,
  resendSignupOtp,
  sendPasswordResetOtp,
  resetPasswordWithOtp,
  changePassword,
} from "../controllers/auth.controller.js";
import auth from "../middlewares/auth.js";
import {
  uploadCompanyDocuments,
  handleUpload,
} from "../controllers/companyDocument.controller.js";

const router = express.Router();
router.post("/signup-otp/send", sendSignupOtp);
router.post("/signup-otp/verify", verifySignupOtp);
router.post("/signup-otp/resend", resendSignupOtp);  
router.post("/password/otp/send", sendPasswordResetOtp);
router.post("/password/otp/verify", resetPasswordWithOtp);
router.post("/login", login);
router.post("/password/change", auth, changePassword);
router.post("/upload-company-docs", uploadCompanyDocuments, handleUpload);

export default router;
