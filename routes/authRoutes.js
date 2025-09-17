import express from "express";
import { register, login, getProfile } from "../controllers/authController.js";
import { protect, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Profile (محتاج تسجيل دخول)
router.get("/profile", protect, getProfile);

// Example: Admin only route
// router.get("/admin", protect, isAdmin, (req, res) => {
//   res.json({ msg: "Welcome Admin" });
// });

export default router;
