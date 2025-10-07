import express from "express";
import {
  login,
  sendSignupOtp,
  verifySignupOtp,
  resendSignupOtp,
} from "../controllers/auth.controller.js";

const router = express.Router();
router.post("/signup-otp/send", sendSignupOtp);
router.post("/signup-otp/verify", verifySignupOtp);
router.post("/signup-otp/resend", resendSignupOtp);  
router.post("/login", login);

export default router;
