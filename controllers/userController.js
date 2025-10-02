// controllers/userController.js
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { getIO, sendNotificationToUser } from "../socket.js";

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    return res.status(200).json(user);
  } catch (err) {
    console.error("getUserProfile error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    return res.status(200).json(user);
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const followUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    const currentId = req.user._id.toString();
    if (targetId === currentId) return res.status(400).json({ msg: "Cannot follow yourself" });

    const target = await User.findById(targetId);
    const me = await User.findById(currentId);
    if (!target) return res.status(404).json({ msg: "User not found" });

    if (target.followers.includes(currentId)) return res.status(400).json({ msg: "Already following" });

    target.followers.push(currentId);
    me.following.push(targetId);

    await target.save();
    await me.save();

    // create notification
    const notif = await Notification.create({
      user: targetId,
      fromUser: currentId,
      type: "follow",
      message: `${me.username} started following you`
    });

    // try sending real-time
    try {
      const populatedNotif = await notif.populate("fromUser", "username avatar");
      await sendNotificationToUser(targetId, populatedNotif);
    } catch (e) { /* ignore socket failures */ }

    return res.status(200).json({ msg: "Followed", followersCount: target.followers.length });
  } catch (err) {
    console.error("followUser error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    const currentId = req.user._id.toString();
    if (targetId === currentId) return res.status(400).json({ msg: "Cannot unfollow yourself" });

    const target = await User.findById(targetId);
    const me = await User.findById(currentId);
    if (!target) return res.status(404).json({ msg: "User not found" });

    target.followers = target.followers.filter(id => id.toString() !== currentId);
    me.following = me.following.filter(id => id.toString() !== targetId);

    await target.save();
    await me.save();

    return res.status(200).json({ msg: "Unfollowed", followersCount: target.followers.length });
  } catch (err) {
    console.error("unfollowUser error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};
