import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
 
  const hdr = req.headers.authorization || "";
  const fromHeader = hdr.toLowerCase().startsWith("bearer ")
    ? hdr.slice(7).trim()
    : null;
  const fromCookie = req.cookies?.token || null;
  const token = fromHeader || fromCookie;

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
    if (err?.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(role) {
  return function (req, res, next) {
    if (!req.user?.role) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}
