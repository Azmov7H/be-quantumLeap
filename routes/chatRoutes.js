// routes/chatRoutes.js
import express from "express";
import { accessChat, getUserChats } from "../controllers/chatController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", protect, accessChat);
router.get("/", protect, getUserChats);

export default router;
