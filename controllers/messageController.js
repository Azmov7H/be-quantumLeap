// controllers/messageController.js
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import Notification from "../models/Notification.js";
import { sendNotificationToUser } from "../socket.js";

export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({ chat: chatId }).populate("sender", "username profileImage").sort({ createdAt: 1 });
    return res.status(200).json(messages);
  } catch (err) {
    console.error("getMessages error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const { chatId } = req.params;

    if (!chatId || (!content && !req.file)) return res.status(400).json({ msg: "chatId and content or file required" });

    const media = req.file ? { url: req.file.path, public_id: req.file.filename || req.file.public_id, type: "image" } : undefined;

    const message = await Message.create({
      chat: chatId,
      sender: req.user._id,
      content: content || "",
      media
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    const populated = await Message.findById(message._id).populate("sender", "username profileImage");

    // Notifications for the other chat users
    const chat = await Chat.findById(chatId).populate("users", "_id");
    for (const user of chat.users) {
      const targetId = String(user._id);
      if (targetId === String(req.user._id)) continue;

      const notif = await Notification.create({
        user: targetId,
        fromUser: req.user._id,
        type: "message",
        message: `${req.user.username || "Someone"} أرسل لك رسالة`,
        chat: chatId
      });

      const populatedNotif = await notif.populate("fromUser", "username profileImage");
      await sendNotificationToUser(targetId, populatedNotif);
    }

    // emit via socket server (if available)
    try {
      const { getIO } = await import("../socket.js");
      const io = getIO();
      io.to(chatId).emit("newMessage", populated);
    } catch (e) { /* ignore if socket not initialized */ }

    return res.status(201).json(populated);
  } catch (err) {
    console.error("sendMessage error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};
