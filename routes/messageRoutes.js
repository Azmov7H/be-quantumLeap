import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getMessages, sendMessage } from "../controllers/messageController.js";

const router = express.Router();

// Get all messages in a chat
router.get("/:chatId", protect, getMessages);

// Send a message
router.post("/", protect, sendMessage);

export default router;
