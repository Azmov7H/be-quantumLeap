import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

// Send message + generate notification


import { getIO } from "../socket.js";

export const sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;

    const message = await Message.create({
      chat: chatId,
      sender: req.user.id,
      content,
    });

    const chat = await Chat.findById(chatId).populate("users", "_id");
    if (!chat) return res.status(404).json({ msg: "Chat not found" });

    chat.latestMessage = message._id;
    await chat.save();

    // إشعارات + WebSocket
    chat.users.forEach(async (user) => {
      if (user._id.toString() !== req.user.id) {
        await Notification.create({
          user: user._id,
          message: `New message from ${req.user.id}`,
        });

        // إرسال الرسالة عبر الـ Socket
        getIO().to(user._id.toString()).emit("newMessage", message);
      }
    });

    res.status(201).json(message);
  } catch (err) {
    console.error("❌ sendMessage error:", err);
    res.status(500).json({ msg: err.message });
  }
};

// Get messages in a chat
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId }).populate("sender", "username profileImage").sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
