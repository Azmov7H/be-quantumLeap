// routes/authRoutes.js
import express from "express";
import { register, login, getProfile, updateProfile } from "../controllers/authController.js";
import { protect } from "../middlewares/auth.js";
import { uploadCloud } from "../utils/multerCloudinary.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getProfile);
router.put("/update", protect, uploadCloud.single("profileImage"), updateProfile);

export default router;
