import Message from "../models/Message.js";
import Chat from "../models/Chat.js";

// ✅ Get all messages in a chat
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "username profileImage")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ✅ Send new message
export const sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;

    if (!chatId || !content) {
      return res.status(400).json({ msg: "chatId and content are required" });
    }

    const message = await Message.create({
      chat: chatId,
      sender: req.user.id,
      content,
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    const populated = await Message.findById(message._id)
      .populate("sender", "username profileImage");

    // 🟢 ابعت socket event لكل الموجودين في الغرفة
    const { getIO } = await import("../socket.js");
    getIO().to(chatId).emit("newMessage", populated);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
