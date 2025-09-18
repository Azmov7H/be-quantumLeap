import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { createPost, getPosts, getPost, updatePost, deletePost } from "../controllers/postController.js";
import { addComment, getComments } from "../controllers/postController.js";
import { toggleLikePost} from "../controllers/postController.js";
const router = express.Router();

router.get("/", getPosts);
router.get("/:id", getPost);
router.post("/", protect, upload.single("image"), createPost);
router.put("/:id", protect, upload.single("image"), updatePost);
router.delete("/:id", protect, deletePost);
router.put("/:id/like", protect, toggleLikePost);
router.post("/:id/comment", protect, addComment);

router.get("/:id/comments", protect, getComments);

export default router;
