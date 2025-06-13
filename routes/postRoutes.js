import express from "express";
import { createPost, getPosts, getPost } from "../controllers/postController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getPosts);
router.post("/", protect, createPost);
router.get("/:id", getPost);

export default router;
