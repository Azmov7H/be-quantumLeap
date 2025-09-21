import Chat from "../models/Chat.js";

// ✅ Start or get existing chat
export const accessChat = async (req, res) => {
  const { userId } = req.body;
  try {
    let chat = await Chat.findOne({
      users: { $all: [req.user.id, userId] },
    })
      .populate("users", "username profileImage")
      .populate("latestMessage");

    if (!chat) {
      chat = await Chat.create({ users: [req.user.id, userId] });
    }

    res.status(200).json(chat);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


// ✅ Get all chats of the logged-in user securely
export const getUserChats = async (req, res) => {
  try {
    let chats = await Chat.find({ users: req.user.id })
      .populate("users", "username profileImage")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "username profileImage" },
      })
      .sort({ updatedAt: -1 });

    // ✅ رجّع بس الشات مع الشخص التاني مش كل اليوزرز
    const safeChats = chats.map(chat => {
      const otherUser = chat.users.find(
        u => u._id.toString() !== req.user.id.toString()
      );

      return {
        _id: chat._id,
        user: otherUser, // الشخص التاني اللي اتكلمت معاه
        lastMessage: chat.latestMessage?.text || null,
        updatedAt: chat.updatedAt,
      };
    });

    res.status(200).json(safeChats);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
