// controllers/notificationController.js
import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate("fromUser", "username profileImage")
      .populate({
        path: "chat",
        populate: { path: "users", select: "username profileImage" }
      })
      .populate("post", "title")
      .sort({ createdAt: -1 });

    return res.status(200).json(notifications);
  } catch (err) {
    console.error("getNotifications error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    return res.status(200).json({ msg: "All notifications marked as read" });
  } catch (err) {
    console.error("markAllAsRead error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};
