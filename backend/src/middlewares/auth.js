import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
    const userId = decoded.sub || decoded.id;
    if (!userId) return res.status(401).json({ message: "Invalid token payload" });

    req.user = { id: userId, role: decoded.role };
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
