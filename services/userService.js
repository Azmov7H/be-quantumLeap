import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { sendNotificationToUser } from "../socket.js";

class UserService {
    async getUserById(id) {
        const user = await User.findById(id).select("-password").lean();
        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }
        return user;
    }

    async followUser(currentUserId, targetUserId) {
        if (currentUserId === targetUserId) {
            const error = new Error("Cannot follow yourself");
            error.statusCode = 400;
            throw error;
        }

        const target = await User.findById(targetUserId);
        const me = await User.findById(currentUserId);

        if (!target) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }

        if (target.followers.includes(currentUserId)) {
            const error = new Error("Already following");
            error.statusCode = 400;
            throw error;
        }

        target.followers.push(currentUserId);
        me.following.push(targetUserId);

        await target.save();
        await me.save();

        // Create Notification
        try {
            const notif = await Notification.create({
                user: targetUserId,
                fromUser: currentUserId,
                type: "follow",
                message: `${me.username} started following you`
            });

            const populatedNotif = await notif.populate("fromUser", "username profileImage");
            await sendNotificationToUser(targetUserId, populatedNotif);
        } catch (e) {
            console.error("Notification error:", e);
            // Do not fail the request if notification fails
        }

        return { msg: "Followed", followersCount: target.followers.length };
    }

    async unfollowUser(currentUserId, targetUserId) {
        if (currentUserId === targetUserId) {
            const error = new Error("Cannot unfollow yourself");
            error.statusCode = 400;
            throw error;
        }

        const target = await User.findById(targetUserId);
        const me = await User.findById(currentUserId);

        if (!target) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }

        target.followers = target.followers.filter(id => id.toString() !== currentUserId);
        me.following = me.following.filter(id => id.toString() !== targetUserId);

        await target.save();
        await me.save();

        return { msg: "Unfollowed", followersCount: target.followers.length };
    }
}

export default new UserService();
