import express from "express";
import { accessChat, getUserChats } from "../controllers/chatController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// إنشاء أو الدخول على شات معين
router.post("/", protect, accessChat);

// جلب كل الشاتس الخاصة باليوزر
router.get("/", protect, getUserChats);

export default router;
