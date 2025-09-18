import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { addComment, getComments } from "../controllers/commentController.js";

const router = express.Router();

router.post("/", protect, addComment);
router.get("/:postId", getComments);

export default router;
