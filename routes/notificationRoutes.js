// routes/notificationRoutes.js
import express from "express";
import { protect } from "../middlewares/auth.js";
import { getNotifications, markAllAsRead } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.put("/read", protect, markAllAsRead);

export default router;
