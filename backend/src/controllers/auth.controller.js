import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Student from "../models/student.model.js";   // student_users
import Company from "../models/company.model.js";   // company_users
import CompanyEmployees from "../models/companyEmployees.model.js"; // companies_employees

const reqd = (v, name) => {
  if (!v || (typeof v === "string" && !v.trim())) throw new Error(`${name} is required`);
};

function signJWT(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET || "devsecret",
    { expiresIn: process.env.JWT_EXPIRES || "7d" }
  );
}

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["student", "company"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const email = String(req.body.email || "").toLowerCase().trim();
    reqd(email, "email");

    // prevent duplicate emails (users = source of truth)
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

        const studentProfile = await Student.create({
          // add userId: createdUser._id if your schema has this
          firstName,
          lastName,
          email,
          password: hashed, // kept because your schema uses it
          school,
          course,
          major,
        });

        return res.status(201).json({
          message: "Account created successfully",
          role: "student",
          profile: {
            id: studentProfile._id,
            firstName,
            lastName,
            school,
            course,
            major,
          },
        });
      }

      // COMPANY
      const companyRole =
        req.body.companyRole || req.body.roleLabel || req.body.role; // accept multiple keys
      const {
        companyName: rawCompanyName,
        firstName,
        lastName,
        industry,
        location,
        companyDescription,
      } = req.body;

      reqd(rawCompanyName, "companyName");
      reqd(firstName, "firstName");
      reqd(lastName, "lastName");
      reqd(companyRole, "role");
      reqd(industry, "industry");
      reqd(companyDescription, "companyDescription");

      const companyName = String(rawCompanyName).trim();
      const isOwner = String(companyRole).toLowerCase() === "owner";

      // Look up the roster doc once (case-insensitive)
      let roster = await CompanyEmployees.findOne({ companyName })
        .collation({ locale: "en", strength: 2 });

      // Owner rules:
      // - If a roster exists AND already has owner -> reject ("taken")
      // - If a roster exists WITHOUT owner -> allow (Owner will claim it after profile creation)
      // - If no roster -> allow (Owner will create it)
      if (isOwner && roster && roster.owner) {
        // rollback the users doc before returning
        await User.deleteOne({ _id: createdUser._id }).catch(() => {});
        return res.status(400).json({ message: "Company name is already taken" });
      }

      // 2a) create company profile (company_users)
      const companyProfile = await Company.create({
        // add userId: createdUser._id if your schema has this
        companyName,
        firstName,
        lastName,
        role: companyRole, // person's title inside the company
        email,
        password: hashed, // kept because your schema uses it
        industry,
        location,
        companyDescription,
      });

      // 3) Maintain companies_employees roster
      if (isOwner) {
        if (!roster) {
          // create new roster with owner
          await CompanyEmployees.create({
            companyName,
            owner: companyProfile._id,
            employees: [],
          });
        } else if (!roster.owner) {
          // claim existing roster (created earlier by HR)
          roster.owner = companyProfile._id;
          await roster.save();
        }
        // (roster with owner already handled above in the guard)
      } else {
        // Non-owner: attach to roster (create placeholder if not found)
        if (!roster) {
          roster = await CompanyEmployees.create({
            companyName,
            owner: undefined,
            employees: [companyProfile._id],
          });
        } else {
          if (!roster.employees.some((id) => String(id) === String(companyProfile._id))) {
            roster.employees.push(companyProfile._id);
            await roster.save();
          }
        }
      }

      return res.status(201).json({
        message: "Account created successfully",
        role: "company",
        profile: {
          id: companyProfile._id,
          companyName,
          firstName,
          lastName,
          companyRole,
        },
      });
    } catch (roleErr) {
      // rollback users doc if profile creation or roster write fails
      if (createdUser?._id) {
        await User.deleteOne({ _id: createdUser._id }).catch(() => {});
      }
      throw roleErr;
    }
  } catch (err) {
    console.error("register error:", err);
    return res.status(400).json({ message: err.message || "Registration failed" });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email = "", password = "", role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ message: "email, password and role are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.role !== role)
      return res.status(403).json({ message: "Role does not match this account" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signJWT(user);

    // tiny profile for convenience (optional)
    let profile = null;
    if (user.role === "student") {
      profile = await Student.findOne({ email: user.email })
        .select("firstName lastName email")
        .lean();
    } else if (user.role === "company") {
      profile = await Company.findOne({ email: user.email })
        .select("companyName firstName lastName email")
        .lean();
    }

    return res.json({
      message: "Logged in",
      token,
      role: user.role,
      profile,
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Login failed" });
  }
};
