import express from "express";
import { register, login, getProfile, updateProfile } from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getProfile);
router.put("/update", protect, upload.single("profileImage"), updateProfile);

export default router;
