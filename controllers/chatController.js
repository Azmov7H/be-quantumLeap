// controllers/chatController.js
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

export const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ msg: "userId required" });

    let chat = await Chat.findOne({ users: { $all: [req.user._id, userId] } })
      .populate("users", "username avatar")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "username avatar" }
      });

    if (!chat) {
      chat = await Chat.create({ users: [req.user._id, userId] });
      chat = await Chat.findById(chat._id).populate("users", "username avatar");
    }

    return res.status(200).json(chat);
  } catch (err) {
    console.error("accessChat error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ users: req.user._id })
      .populate("users", "username avatar")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "username avatar" }
      })
      .sort({ updatedAt: -1 });

    // map to simple view: otherUser + lastMessage
    const safeChats = chats.map(chat => {
      const otherUser = chat.users.find(u => String(u._id) !== String(req.user._id));
      return {
        _id: chat._id,
        user: otherUser || null,
        lastMessage: chat.latestMessage ? (chat.latestMessage.content || null) : null,
        updatedAt: chat.updatedAt
      };
    });

    return res.status(200).json(safeChats);
  } catch (err) {
    console.error("getUserChats error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};
