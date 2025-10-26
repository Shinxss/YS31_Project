// backend/middleware/auth.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "replace_with_strong_secret";

export const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ message: "No token provided." });

    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // payload contains id, email, role
    return next();
  } catch (err) {
    console.warn("Auth middleware error:", err?.message || err);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};
