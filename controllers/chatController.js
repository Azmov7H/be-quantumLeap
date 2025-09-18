import Chat from "../models/Chat.js";

// Start or get existing chat
export const accessChat = async (req, res) => {
  const { userId } = req.body;
  try {
    let chat = await Chat.findOne({ users: { $all: [req.user.id, userId] } }).populate("users", "username profileImage");
    if (!chat) chat = await Chat.create({ users: [req.user.id, userId] });
    res.status(200).json(chat);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
