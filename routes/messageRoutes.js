// routes/messageRoutes.js
import express from "express";
import { protect } from "../middlewares/auth.js";
import { uploadCloud } from "../utils/multerCloudinary.js";
import { getMessages, sendMessage } from "../controllers/messageController.js";

const router = express.Router();

router.get("/:chatId", protect, getMessages);
router.post("/", protect, uploadCloud.single("media"), sendMessage);

export default router;
