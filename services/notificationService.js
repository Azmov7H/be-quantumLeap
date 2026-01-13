import Notification from "../models/Notification.js";

class NotificationService {
    async getUserNotifications(userId) {
        return await Notification.find({ user: userId })
            .populate("fromUser", "username profileImage")
            .populate({
                path: "chat",
                populate: { path: "users", select: "username profileImage" }
            })
            .populate("post", "title")
            .sort({ createdAt: -1 })
            .lean();
    }

    async markAllAsRead(userId) {
        await Notification.updateMany({ user: userId, read: false }, { read: true });
        return { msg: "All notifications marked as read" };
    }
}

export default new NotificationService();
