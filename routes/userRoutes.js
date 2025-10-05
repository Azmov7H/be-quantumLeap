import express from "express";
import { getUserProfile, followUser, unfollowUser, getCurrentUser } from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";
import multer from "multer";
const upload = multer({ dest: "uploads/" });
import { updateUserProfile } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", protect, getCurrentUser); // الجديد


router.put("/me", protect, upload.single("avatar"), updateUserProfile);

router.get("/:id", getUserProfile);
router.post("/:id/follow", protect, followUser);
router.post("/:id/unfollow", protect, unfollowUser);

export default router;
