import Notification from "../models/Notification.js";

// Get all notifications for the logged-in user
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 }); // أحدث الإشعارات أولاً
    res.status(200).json(notifications);
  } catch (err) {
    console.error("❌ getNotifications error:", err);
    res.status(500).json({ msg: err.message });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );
    res.status(200).json({ msg: "All notifications marked as read" });
  } catch (err) {
    console.error("❌ markAllAsRead error:", err);
    res.status(500).json({ msg: err.message });
  }
};
