import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Student from "../models/student.model.js";
import Company from "../models/company.model.js";

const reqd = (v, name) => { if (!v || (typeof v === "string" && !v.trim())) throw new Error(`${name} is required`); };

export const register = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["student", "company"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const email = String(req.body.email || "").toLowerCase().trim();
    reqd(email, "email");

    // prevent duplicates (users collection is the source of truth)
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    // hash once
    const rawPassword = req.body.password;
    reqd(rawPassword, "password");
    const hashed = await bcrypt.hash(rawPassword, 10);

    // 1) create in users
    let createdUser = await User.create({
      email,
      password: hashed,
      role,
      status: "active",
    });

    try {
      // 2) create in role-specific collection
      if (role === "student") {
        const { firstName, lastName, school, course, major } = req.body;
        reqd(firstName, "firstName");
        reqd(lastName, "lastName");
        reqd(school, "school");
        reqd(course, "course");

        await Student.create({
          firstName,
          lastName,
          email,
          password: hashed, // per your schema
          school,
          course,
          major,
        });
      } else {
        // company role label (Owner/Recruiter/etc)
        const companyRole = req.body.companyRole || req.body.roleLabel || req.body.role; // accept several keys
        const {
          companyName,
          firstName,
          lastName,
          industry,
          location,
          companyDescription,
        } = req.body;

        reqd(companyName, "companyName");
        reqd(firstName, "firstName");
        reqd(lastName, "lastName");
        reqd(companyRole, "role");
        reqd(industry, "industry");
        reqd(companyDescription, "companyDescription");

        await Company.create({
          companyName,
          firstName,
          lastName,
          role: companyRole,
          email,
          password: hashed, // per your schema
          industry,
          location,
          companyDescription,
        });
      }

      return res.status(201).json({ message: "Account created successfully" });
    } catch (roleErr) {
      // rollback users doc if profile creation fails
      if (createdUser?._id) {
        await User.deleteOne({ _id: createdUser._id }).catch(() => {});
      }
      throw roleErr;
    }
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: err.message || "Registration failed" });
  }
};

//LOGIN
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
      { expiresIn: process.env.JWT_EXPIRES || "7d" }
    );

    // optional: fetch minimal profile for convenience
    let profile = null;
    if (user.role === "student") {
      profile = await Student.findOne({ email: user.email }).select("firstName lastName email");
    } else {
      profile = await Company.findOne({ email: user.email }).select("companyName firstName lastName email");
    }

    return res.json({
      message: "Logged in",
      token,
      role: user.role,
      profile
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Login failed" });
  }
};
