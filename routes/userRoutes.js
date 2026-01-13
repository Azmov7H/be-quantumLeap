import express from "express";
import { getUserProfile, followUser, unfollowUser, getCurrentUser } from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";
import { uploadCloud } from "../utils/multerCloudinary.js";
import { updateUserProfile } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", protect, getCurrentUser);

// Use uploadCloud instead of local multer
router.put("/me", protect, uploadCloud.single("avatar"), updateUserProfile);

router.get("/:id", getUserProfile);
router.post("/:id/follow", protect, followUser);
router.post("/:id/unfollow", protect, unfollowUser);

export default router;
