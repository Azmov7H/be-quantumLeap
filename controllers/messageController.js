import Message from "../models/Message.js";
import Chat from "../models/Chat.js";

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;

    const message = await Message.create({
      chat: chatId,
      sender: req.user.id,
      content,
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get messages in a chat
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "username")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
