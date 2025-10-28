import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/user.model.js";
import Student from "../models/student.model.js";
import Company from "../models/company.model.js";
import CompanyEmployees from "../models/companyEmployees.model.js";
import OtpToken from "../models/otpToken.model.js";
import PasswordResetToken from "../models/passwordResetToken.model.js";
import Notification from "../models/Notification.js";
import { sendOtpEmail } from "../utils/mailer.js";

/* ------------------ helpers ------------------ */
const reqd = (v, name) => {
  if (!v || (typeof v === "string" && !v.trim()))
    throw new Error(`${name} is required`);
};

// Resolve the canonical Company _id for a user (owner or employee)
async function resolveCompanyIdByUser({ userId, email, companyNameHint }) {
  const emailL = (email || "").toLowerCase();

  // 1) Owner by explicit link or email on Company
  if (userId) {
    const byUser = await Company.findOne({ user: userId }).lean();
    if (byUser?._id) return byUser._id;
  }
  if (emailL) {
    const byEmail = await Company.findOne({ email: emailL }).lean();
    if (byEmail?._id) return byEmail._id;
  }

  // 2) Employee via CompanyEmployees -> Company (by companyName)
  let companyName = companyNameHint;
  if (!companyName && emailL) {
    const empDoc = await CompanyEmployees.findOne({
      "employees.email": emailL,
    })
      .collation({ locale: "en", strength: 2 })
      .lean();
    if (empDoc?.companyName) companyName = empDoc.companyName;
  }

  if (companyName) {
    const comp = await Company.findOne({ companyName })
      .collation({ locale: "en", strength: 2 })
      .lean();
    if (comp?._id) return comp._id;
  }

  return null;
}

// Sign a JWT and include companyId for company users when available
function signJwt({ userId, role, email, companyId }) {
  const payload = { sub: userId, role, email };
  if (companyId) payload.companyId = String(companyId);

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

/* ------------------ Send Signup OTP ------------------ */
export const sendSignupOtp = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["student", "company"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const email = String(req.body.email || "").toLowerCase().trim();
    reqd(email, "email");
    const rawPassword = req.body.password;
    reqd(rawPassword, "password");

    // block duplicate email
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "Email already registered" });

    // hash password BEFORE persisting to any storage
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Validate + build payload (we store only hashedPassword)
    let payload = { role, email, hashedPassword };

    if (role === "student") {
      const { firstName, lastName, course } = req.body;
      reqd(firstName, "firstName");
      reqd(lastName, "lastName");
      reqd(course, "course");
      payload = { ...payload, firstName, lastName, course };
    } else {
      const { companyName, firstName, lastName, companyRole, industry, legalDocs, taxDocs } =
        req.body;
      reqd(companyName, "companyName");
      reqd(firstName, "firstName");
      reqd(lastName, "lastName");
      reqd(companyRole, "companyRole");

      if (companyRole === "Owner") {
        reqd(industry, "industry");
      }

      const existingCompanyDoc = await CompanyEmployees.findOne({ companyName })
        .collation({ locale: "en", strength: 2 })
        .lean();

      if (companyRole === "Owner") {
        if (existingCompanyDoc)
          return res
            .status(409)
            .json({ message: "Company name already exists" });
      } else {
        if (!existingCompanyDoc) {
          return res.status(404).json({
            message: "Company not found. Ask your owner to create it first.",
          });
        }
      }

      payload = {
        ...payload,
        companyName,
        firstName,
        lastName,
        companyRole,
        ...(companyRole === "Owner" && { industry }),
        ...(companyRole === "Owner" && legalDocs && { legalDocs: Array.isArray(legalDocs) ? legalDocs : [legalDocs] }),
        ...(companyRole === "Owner" && taxDocs && { taxDocs: Array.isArray(taxDocs) ? taxDocs : [taxDocs] }),
      };
    }

    // Create OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Replace any existing OTP for this email
    await OtpToken.deleteMany({ email });
    await OtpToken.create({
      email,
      codeHash,
      expiresAt,
      attempts: 0,
      payload,
    });

    // Send email
    await sendOtpEmail({
      to: email,
      otp: code,
      expiryTime: 10,
    });

    return res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("sendSignupOtp error:", err);
    return res
      .status(400)
      .json({ message: err.message || "Failed to send OTP" });
  }
};

/* ------------------ Verify OTP + Create Account ------------------ */
export const verifySignupOtp = async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    const code = String(req.body.code || "").trim();

    reqd(email, "email");
    reqd(code, "code");

    const record = await OtpToken.findOne({ email });
    if (!record)
      return res.status(400).json({ message: "No pending verification" });

    if (record.expiresAt < new Date()) {
      await OtpToken.deleteOne({ _id: record._id });
      return res.status(400).json({ message: "Code expired" });
    }

    if (record.attempts >= 5) {
      await OtpToken.deleteOne({ _id: record._id });
      return res.status(429).json({ message: "Too many attempts" });
    }

    const ok = await bcrypt.compare(code, record.codeHash);
    if (!ok) {
      record.attempts += 1;
      await record.save();
      return res.status(401).json({ message: "Invalid code" });
    }

    // Double-check email wasn't registered while OTP was pending
    const already = await User.findOne({ email });
    if (already) {
      await OtpToken.deleteOne({ _id: record._id });
      return res.status(409).json({ message: "Email already registered" });
    }

    const payload = record.payload;

    // 1) Create User
    const createdUser = await User.create({
      email,
      password: payload.hashedPassword,
      role: payload.role,
      status: "active",
    });

    // 2) Role-specific document
    let companyIdForJwt = null;

    if (payload.role === "student") {
      await Student.create({
        firstName: payload.firstName,
        lastName: payload.lastName,
        email,
        course: payload.course,
        user: createdUser._id,
      });
    } else {
      // Company owner or employee
      const companyDoc = await Company.create({
        companyName: payload.companyName,
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: payload.companyRole,
        email,
        industry: payload.industry,
        user: createdUser._id,
      });

      companyIdForJwt = companyDoc?._id || null;

      if (payload.companyRole === "Owner") {
        const updateData = {
          $setOnInsert: { companyName: payload.companyName, employees: [] },
          $set: {
            owner: {
              email,
              firstName: payload.firstName,
              lastName: payload.lastName,
            },
          },
        };

        // Add documents if they exist
        if (payload.legalDocs && payload.legalDocs.length > 0) {
          updateData.$set.legalRegistrationDocs = payload.legalDocs;
        }
        if (payload.taxDocs && payload.taxDocs.length > 0) {
          updateData.$set.taxIdentityDocs = payload.taxDocs;
        }

        await CompanyEmployees.updateOne(
          { companyName: payload.companyName },
          updateData,
          { upsert: true, collation: { locale: "en", strength: 2 } }
        );
      } else {
        await CompanyEmployees.updateOne(
          { companyName: payload.companyName },
          {
            $addToSet: {
              employees: {
                email,
                firstName: payload.firstName,
                lastName: payload.lastName,
                role: payload.companyRole,
              },
            },
          },
          { collation: { locale: "en", strength: 2 } }
        );

        // For employees, ensure we store the *existing* company _id in JWT
        // (If above created a company doc for a non-owner, look up the canonical one)
        if (!companyIdForJwt) {
          companyIdForJwt = await resolveCompanyIdByUser({
            email,
            companyNameHint: payload.companyName,
          });
        }
      }
    }

    // Notify admin if company account created
    if (payload.role === "company") {
      await Notification.create({
        title: "New Company Registration",
        body: `A new company account has been created: ${payload.companyName} (${payload.firstName} ${payload.lastName})`,
        type: "company_registration",
        recipientEmail: process.env.ADMIN_EMAIL || "admin@internconnect.com",
        data: {
          companyName: payload.companyName,
          ownerName: `${payload.firstName} ${payload.lastName}`,
          ownerEmail: email,
          industry: payload.industry,
          createdAt: new Date(),
        },
      });
    }

    // Cleanup OTP
    await OtpToken.deleteOne({ _id: record._id });

    // 3) Issue JWT (with companyId for company users)
    const token = signJwt({
      userId: createdUser._id.toString(),
      role: createdUser.role,
      email: createdUser.email,
      companyId:
        createdUser.role === "company"
          ? companyIdForJwt ||
            (await resolveCompanyIdByUser({
              userId: createdUser._id,
              email: createdUser.email,
              companyNameHint: payload.companyName,
            }))
          : null,
    });

    return res.status(201).json({
      message: "Account verified & created",
      token,
      role: createdUser.role,
      companyId:
        createdUser.role === "company"
          ? jwt.decode(token)?.companyId || null
          : null,
    });
  } catch (err) {
    console.error("verifySignupOtp error:", err);
    return res.status(400).json({ message: err.message || "Verification failed" });
  }
};

/* ------------------ Resend OTP ------------------ */
export const resendSignupOtp = async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ message: "email is required" });

    const tokenDoc = await OtpToken.findOne({ email });
    if (!tokenDoc) {
      return res
        .status(404)
        .json({ message: "No pending signup for this email. Please start again." });
    }

    // 60s cooldown before resending
    const last = tokenDoc.updatedAt?.getTime?.() || 0;
    if (Date.now() - last < 60 * 1000) {
      const wait = Math.ceil((60 * 1000 - (Date.now() - last)) / 1000);
      return res.status(429).json({ message: `Please wait ${wait}s before resending.` });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    tokenDoc.codeHash = await bcrypt.hash(code, 10);
    tokenDoc.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    tokenDoc.attempts = 0;
    await tokenDoc.save();

    await sendOtpEmail({
      to: email,
      otp: code,
      expiryTime: 10,
    });

    res.json({ message: "OTP resent" });
  } catch (err) {
    console.error("resendSignupOtp error:", err);
    res.status(400).json({ message: err.message || "Failed to resend OTP" });
  }
};

/* ------------------ Password Reset: Send OTP ------------------ */
export const sendPasswordResetOtp = async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    reqd(email, "email");

    const user = await User.findOne({ email });
    if (!user) return res.json({ message: "If that email exists, an OTP has been sent" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await PasswordResetToken.deleteMany({ email });
    await PasswordResetToken.create({ email, codeHash, expiresAt, attempts: 0 });

    await sendOtpEmail({ to: email, otp: code, expiryTime: 10 });

    return res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("sendPasswordResetOtp error:", err);
    return res.status(400).json({ message: err.message || "Failed to send OTP" });
  }
};

/* ------------------ Password Reset: Verify + Set New Password ------------------ */
export const resetPasswordWithOtp = async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    const code = String(req.body.code || "").trim();
    const newPassword = String(req.body.newPassword || "");
    reqd(email, "email");
    reqd(code, "code");
    reqd(newPassword, "newPassword");

    const tokenDoc = await PasswordResetToken.findOne({ email });
    if (!tokenDoc) return res.status(400).json({ message: "No pending reset" });
    if (tokenDoc.expiresAt < new Date()) {
      await PasswordResetToken.deleteOne({ _id: tokenDoc._id });
      return res.status(400).json({ message: "Code expired" });
    }
    if (tokenDoc.attempts >= 5) {
      await PasswordResetToken.deleteOne({ _id: tokenDoc._id });
      return res.status(429).json({ message: "Too many attempts" });
    }

    const ok = await bcrypt.compare(code, tokenDoc.codeHash);
    if (!ok) {
      tokenDoc.attempts += 1;
      await tokenDoc.save();
      return res.status(401).json({ message: "Invalid code" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      await PasswordResetToken.deleteOne({ _id: tokenDoc._id });
      return res.status(404).json({ message: "User not found" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await PasswordResetToken.deleteOne({ _id: tokenDoc._id });

    return res.json({ message: "Password updated" });
  } catch (err) {
    console.error("resetPasswordWithOtp error:", err);
    return res.status(400).json({ message: err.message || "Failed to reset password" });
  }
};

/* ------------------ Login ------------------ */
export const login = async (req, res) => {
  try {
    const { email = "", password = "", role } = req.body;
    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ message: "email, password and role are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.role !== role)
      return res.status(403).json({ message: "Role does not match this account" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    // Check if company is verified (only for company role)
    if (user.role === "company") {
      const CompanyEmployees = (await import("../models/companyEmployees.model.js")).default;
      const company = await CompanyEmployees.findOne({ "owner.email": user.email }).lean();
      
      if (company && !company.isVerified) {
        return res.status(403).json({ 
          message: "Please wait for admin approval. Your account is pending verification." 
        });
      }
    }

    // Compute companyId for company users (owner or employee)
    const companyId =
      user.role === "company"
        ? await resolveCompanyIdByUser({
            userId: user._id,
            email: user.email,
          })
        : null;

    const token = signJwt({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      companyId,
    });

    return res.json({
      message: "Logged in",
      token,
      role: user.role,
      companyId: companyId ? String(companyId) : null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Login failed" });
  }
};

/* ------------------ Change Password (Authenticated) ------------------ */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { currentPassword = "", newPassword = "" } = req.body || {};
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(401).json({ message: "Current password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: "Password updated" });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(400).json({ message: err.message || "Failed to change password" });
  }
};
