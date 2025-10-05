// routes/postRoutes.js
import express from "express";
import { protect } from "../middlewares/auth.js";
import { uploadCloud } from "../utils/multerCloudinary.js";
import {
  createPost, getPosts, getPost, updatePost, deletePost,
  toggleLikePost, addComment, getComments
} from "../controllers/postController.js";

const router = express.Router();

router.get("/", getPosts);
router.get("/:id", getPost);
router.post("/", protect, uploadCloud.single("image"), createPost);
router.put("/:id", protect, uploadCloud.single("image"), updatePost);
router.delete("/:id", protect, deletePost);
router.put("/:id/like", protect, toggleLikePost);
router.post("/:id/comment", protect, addComment);
router.get("/:id/comments", getComments);

export default router;
