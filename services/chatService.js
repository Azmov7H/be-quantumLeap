import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import { sendNotificationToUser } from "../socket.js";
import cloudinary from "../config/cloudinary.js"; // Standard import

class ChatService {
    async accessChat(currentUserId, targetUserId) {
        if (!targetUserId) {
            const error = new Error("userId required");
            error.statusCode = 400;
            throw error;
        }

        let chat = await Chat.findOne({ users: { $all: [currentUserId, targetUserId] } })
            .populate("users", "username profileImage")
            .populate({
                path: "latestMessage",
                populate: { path: "sender", select: "username profileImage" }
            })
            .lean();

        if (!chat) {
            chat = await Chat.create({ users: [currentUserId, targetUserId] });
            chat = await Chat.findById(chat._id)
                .populate("users", "username profileImage")
                .lean();
        }

        return chat;
    }

    async getUserChats(userId) {
        const chats = await Chat.find({ users: userId })
            .populate("users", "username profileImage")
            .populate({
                path: "latestMessage",
                populate: { path: "sender", select: "username profileImage" }
            })
            .sort({ updatedAt: -1 })
            .lean();

        // Map to simple view: otherUser + lastMessage
        return chats.map(chat => {
            const otherUser = chat.users.find(u => String(u._id) !== String(userId));
            return {
                _id: chat._id,
                user: otherUser || null,
                lastMessage: chat.latestMessage ? (chat.latestMessage.content || null) : null,
                updatedAt: chat.updatedAt
            };
        });
    }

    async getMessages(chatId, limit = 20, before) {
        const query = { chat: chatId };

        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .populate("sender", "username profileImage")
            .sort({ createdAt: -1 }) // newest first
            .limit(Number(limit))
            .lean();

        const reversedMessages = messages.reverse();

        return {
            messages: reversedMessages,
            nextCursor: messages.length > 0 ? messages[0].createdAt : null, // The oldest message in this batch is the cursor for next request (older)
            // Actually, if we reversed, messages[0] is the oldest? No, messages[0] from DB query is newest. messages[length-1] is oldest.
            // Wait, sort({ createdAt: -1 }) means index 0 is NEWEST. index N is OLDEST.
            // So if we take top 20 newest. 
            // Client shows them reversed (chronological).
            // Client wants 'before' the oldest message in this list. 
            // So nextCursor should be messages[messages.length - 1].createdAt.
            // BUT wait, in the original code: 
            // `nextCursor: messages.length > 0 ? messages[0].createdAt : null`
            // If messages were sorted -1 (Newest first), then messages[0] is the NEWEST.
            // If I paginate backwards, I need to fetch messages older than the *oldest* message I currently have.
            // So `before` cursor should be the oldest message's date.
            // If original code used messages[0], and messages are reversed before return? 
            // Original code: `const reversedMessages = messages.reverse();` 
            // Then uses `messages[0]` which is now the OLDEST (after reverse) IF `messages` refers to the mutated array.
            // Array.prototype.reverse() MUTATES.
            // So `messages[0]` IS the oldest message in the set. Correct.
            // My code here: `reversedMessages = messages.reverse()`.
            // So `messages[0]` is correct.
            hasMore: messages.length === Number(limit)
        };
    }

    async sendMessage(senderId, senderUser, chatId, content, file) {
        if (!chatId || (!content && !file)) {
            const error = new Error("chatId and content or file required");
            error.statusCode = 400;
            throw error;
        }

        let media;
        if (file) {
            media = { url: file.path, public_id: file.filename || file.public_id, type: "image" };
        }

        const message = await Message.create({
            chat: chatId,
            sender: senderId,
            content: content || "",
            media
        });

        await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

        const populated = await Message.findById(message._id)
            .populate("sender", "username profileImage")
            .lean();

        // Notifications & Socket
        // We need to fetch chat to get users
        const chat = await Chat.findById(chatId)
            .select("users")
            .lean();

        if (!chat) return populated;

        // We can do this async without awaiting if we want faster API response, but for "Consistency" let's await or use Promise.all
        // However, to keep service pure, I'll return the populated message and handle side-effects (notifs) here.

        for (const user of chat.users) {
            const targetId = String(user._id);
            if (targetId === String(senderId)) continue;

            // Notification
            try {
                const notif = await Notification.create({
                    user: targetId,
                    fromUser: senderId,
                    type: "message",
                    message: `${senderUser.username || "Someone"} أرسل لك رسالة`,
                    chat: chatId
                });
                const populatedNotif = await notif.populate("fromUser", "username profileImage");
                await sendNotificationToUser(targetId, populatedNotif);
            } catch (e) { console.error("Notif Error", e); }
        }

        // Socket Emit
        try {
            const { getIO } = await import("../socket.js");
            const io = getIO();
            io.to(chatId).emit("newMessage", populated);
        } catch (e) { /* ignore */ }

        return populated;
    }
}

export default new ChatService();
