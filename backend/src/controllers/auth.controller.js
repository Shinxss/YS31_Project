import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/user.model.js";
import Student from "../models/student.model.js";
import Company from "../models/company.model.js";
import CompanyEmployees from "../models/companyEmployees.model.js";
import OtpToken from "../models/otpToken.model.js";
import { sendMail } from "../utils/mailer.js";

const reqd = (v, name) => {
  if (!v || (typeof v === "string" && !v.trim())) throw new Error(`${name} is required`);
};

// ------------------ Send Otp ------------------
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

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    //Validation for Sending OTP
    let payload = { role, email, password: rawPassword };

    if (role === "student") {
      const { firstName, lastName, school, course, major } = req.body;
      reqd(firstName, "firstName");
      reqd(lastName, "lastName");
      reqd(school, "school");
      reqd(course, "course");

      payload = { ...payload, firstName, lastName, school, course, major: major || "" };
    } else {
      const { companyName, firstName, lastName, companyRole, industry } = req.body;
      reqd(companyName, "companyName");
      reqd(firstName, "firstName");
      reqd(lastName, "lastName");
      reqd(companyRole, "companyRole");
      reqd(industry, "industry");

      // Owner must have unique companyName
      if (companyRole === "Owner") {
        const exists = await CompanyEmployees.findOne({ companyName })
          .collation({ locale: "en", strength: 2 });
        if (exists) {
          return res.status(409).json({ message: "Company name already exists" });
        }
      } else {
        // non-owner must join an existing company
        const exists = await CompanyEmployees.findOne({ companyName })
          .collation({ locale: "en", strength: 2 });
        if (!exists) {
          return res.status(404).json({ message: "Company not found. Ask your owner to create it first." });
        }
      }

      payload = {
        ...payload,
        companyName,
        firstName,
        lastName,
        companyRole,
        industry,
      };
    }

    // Generate OTP
    const code = (Math.floor(100000 + Math.random() * 900000)).toString(); // 6 digits
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Save OTP record (replace any existing for this email)
    await OtpToken.deleteMany({ email });
    await OtpToken.create({ email, codeHash, expiresAt, attempts: 0, payload });

    // Send email
    await sendMail({
      to: email,
      subject: "Your InternConnect verification code",
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
      html: `
        <div style="font-family:Arial,sans-serif;font-size:14px;color:#111">
          <h2>InternConnect</h2>
          <p>Use this verification code to complete your sign up:</p>
          <div style="font-size:24px;font-weight:bold;letter-spacing:4px;">${code}</div>
          <p style="color:#666">This code expires in 10 minutes.</p>
        </div>
      `,
    });

    return res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("sendSignupOtp error:", err);
    return res.status(400).json({ message: err.message || "Failed to send OTP" });
  }
};

// ------------------ OTP: STEP 2 (verify + create) ------------------
export const verifySignupOtp = async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    const code = String(req.body.code || "").trim();

    reqd(email, "email");
    reqd(code, "code");

    const record = await OtpToken.findOne({ email });
    if (!record) return res.status(400).json({ message: "No pending verification" });

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

    // Code is valid → finalize signup
    const payload = record.payload;
    const emailLower = email;
    const hashed = await bcrypt.hash(payload.password, 10);

    // users
    const createdUser = await User.create({
      email: emailLower,
      password: hashed,
      role: payload.role,
      status: "active",
    });

    // role-specific + company_employees rules
    if (payload.role === "student") {
      await Student.create({
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: emailLower,
        password: hashed,
        school: payload.school,
        course: payload.course,
        major: payload.major || "",
      });
    } else {
      // company_users
      await Company.create({
        companyName: payload.companyName,
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: payload.companyRole,
        email: emailLower,
        password: hashed,
        industry: payload.industry,
      });

      // company_employees
      if (payload.companyRole === "Owner") {
        // create or upsert as owner
        await CompanyEmployees.updateOne(
          { companyName: payload.companyName },
          {
            $setOnInsert: { companyName: payload.companyName, employees: [] },
            $set: {
              owner: {
                email: emailLower,
                firstName: payload.firstName,
                lastName: payload.lastName,
              },
            },
          },
          { upsert: true, collation: { locale: "en", strength: 2 } }
        );
      } else {
        // push employee into company
        await CompanyEmployees.updateOne(
          { companyName: payload.companyName },
          {
            $addToSet: {
              employees: {
                email: emailLower,
                firstName: payload.firstName,
                lastName: payload.lastName,
                role: payload.companyRole,
              },
            },
          },
          { collation: { locale: "en", strength: 2 } }
        );
      }
    }

    // cleanup OTP
    await OtpToken.deleteOne({ _id: record._id });

    // optional: auto-login after verification
    const token = jwt.sign(
      { sub: createdUser._id.toString(), role: createdUser.role, email: createdUser.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }  // <- use JWT_EXPIRES_IN
    );

    return res.status(201).json({ message: "Account verified & created", token, role: createdUser.role });
  } catch (err) {
    console.error("verifySignupOtp error:", err);
    return res.status(400).json({ message: err.message || "Verification failed" });
  }
};

// ------------------ Classic login ------------------
export const login = async (req, res) => {
  try {
    const { email = "", password = "", role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ message: "email, password and role are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.role !== role) return res.status(403).json({ message: "Role does not match this account" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { sub: user._id.toString(), role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.json({ message: "Logged in", token, role: user.role });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Login failed" });
  }
};
// ------------------ OTP: RESEND (keep same payload, new code) ------------------
export const resendSignupOtp = async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ message: "email is required" });

    // must already have a pending signup (so we don't resend for unknown emails)
    const tokenDoc = await OtpToken.findOne({ email });
    if (!tokenDoc) {
      return res.status(404).json({ message: "No pending signup for this email. Please start again." });
    }

    // simple cooldown: 1 min between resends
    const last = tokenDoc.updatedAt?.getTime?.() || 0;
    if (Date.now() - last < 60 * 1000) {
      return res.status(429).json({ message: "Please wait a minute before resending." });
    }

    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    tokenDoc.codeHash = await bcrypt.hash(code, 10);
    tokenDoc.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    tokenDoc.attempts = 0;
    await tokenDoc.save();

    await sendMail({
      to: email,
      subject: "Your new InternConnect verification code",
      text: `Your new verification code is ${code}. It expires in 10 minutes.`,
      html: `
        <div style="font-family:Arial,sans-serif;font-size:14px;color:#111">
          <h2>InternConnect</h2>
          <p>Use this verification code to complete your sign up:</p>
          <div style="font-size:24px;font-weight:bold;letter-spacing:4px;">${code}</div>
          <p style="color:#666">This code expires in 10 minutes.</p>
        </div>
      `,
    });

    res.json({ message: "OTP resent" });
  } catch (err) {
    console.error("resendSignupOtp error:", err);
    res.status(400).json({ message: err.message || "Failed to resend OTP" });
  }
};

