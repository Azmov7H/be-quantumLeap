import express from "express";
import { protect, isAdmin } from "../middlewares/auth.js";
import { approvePost, rejectPost, getPendingPosts } from "../controllers/moderationController.js";

const router = express.Router();

router.get("/pending", protect, isAdmin, getPendingPosts);
router.put("/approve/:id", protect, isAdmin, approvePost);
router.put("/reject/:id", protect, isAdmin, rejectPost);

export default router;
