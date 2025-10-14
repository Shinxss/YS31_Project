import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const fromHeader = hdr.toLowerCase().startsWith("bearer ")
    ? hdr.slice(7).trim()
    : null;
  const fromCookie = req.cookies?.token || null;
  const fromQuery = req.query?.token || null; // ✅ optional
  const token = fromHeader || fromCookie || fromQuery;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
    const userId = decoded.sub || decoded.id;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.user = {
      id: userId,
      role: decoded.role,
      email: decoded.email,
      token,
    };

    return next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    if (err?.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Named aliases for flexibility
export const protect = auth;

export function requireRole(role) {
  return function (req, res, next) {
    if (!req.user?.role) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role !== role)
      return res.status(403).json({ message: "Forbidden" });
    next();
  };
}

export const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user?.role) return res.status(401).json({ message: "Unauthorized" });
  if (!allowedRoles.includes(req.user.role))
    return res.status(403).json({ message: "Forbidden" });
  next();
};
