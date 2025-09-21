import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getMessages } from "../controllers/messageController.js";

const router = express.Router();

// ✅ Get chat messages
router.get("/:chatId", protect, getMessages);

export default router;
