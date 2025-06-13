import express from "express";
import {
  approvePost,
  rejectPost,
  getPendingPosts,
} from "../controllers/moderationController.js";
import { protect, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/pending", protect, isAdmin, getPendingPosts);
router.put("/approve/:id", protect, isAdmin, approvePost);
router.put("/reject/:id", protect, isAdmin, rejectPost);

export default router;
