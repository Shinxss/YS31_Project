// backend/controllers/admin.controller.js
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const JWT_SECRET = process.env.JWT_SECRET || "replace_with_strong_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * POST /api/admin/login
 * body: { email, password }
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

    // need to select password because schema sets select:false
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!admin) return res.status(401).json({ message: "Invalid credentials." });

    const match = await admin.comparePassword(password);
    if (!match) return res.status(401).json({ message: "Invalid credentials." });

    if (admin.status !== "active") return res.status(403).json({ message: "Admin account is not active." });

    const payload = { id: admin._id.toString(), email: admin.email, role: admin.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.json({
      token,
      admin: { id: admin._id.toString(), name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/admin/me
 * Protected route (require auth middleware)
 */
export const me = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const { id } = req.user || {};
    if (!id) return res.status(401).json({ message: "Not authenticated." });

    const admin = await Admin.findById(id).select("-password");
    if (!admin) return res.status(404).json({ message: "Admin not found." });

    return res.json({ admin });
  } catch (err) {
    console.error("Admin me error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
