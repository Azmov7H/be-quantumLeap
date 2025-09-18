import express from "express";
import { register, login, getProfile, updateProfile } from "../controllers/authController.js";
import { protect, isAdmin } from "../middlewares/authMiddleware.js";


const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getProfile);
router.put("/update", protect, updateProfile);

export default router;
