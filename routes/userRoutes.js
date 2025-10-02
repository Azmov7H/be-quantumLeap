import express from "express";
import { getUserProfile, followUser, unfollowUser, getCurrentUser } from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.get("/me", protect, getCurrentUser); // الجديد
router.get("/:id", getUserProfile);
router.post("/:id/follow", protect, followUser);
router.post("/:id/unfollow", protect, unfollowUser);

export default router;
