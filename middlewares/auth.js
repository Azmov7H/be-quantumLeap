// middlewares/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token = null;
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) return res.status(401).json({ msg: "Not authorized, no token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ msg: "Not authorized, user not found" });

    req.user = user; // attach user document
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") return res.status(401).json({ msg: "Token expired" });
    console.error("Auth error:", err);
    return res.status(401).json({ msg: "Not authorized" });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ msg: "Admin access only" });
};
