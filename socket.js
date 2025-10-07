import { Server } from "socket.io";
import Notification from "./models/Notification.js";
import Message from "./models/Message.js";
import Chat from "./models/Chat.js";
import Post from "./models/Post.js";

let io;
export const onlineUsers = new Map(); // userId -> socketId

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL, // أو دومين الفرونت
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // 🧠 تخزين المستخدم لما يتصل
    socket.on("user_connected", (userId) => {
      try {
        if (!userId) return;
        onlineUsers.set(String(userId), socket.id);
        socket.userId = String(userId);
        console.log(`User registered on socket: ${userId} -> ${socket.id}`);
      } catch (err) {
        console.error("user_connected error:", err);
      }
    });

    // ✅ الانضمام لغرفة شات
    socket.on("joinChat", (chatId) => {
      if (!chatId) return;
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined chat ${chatId}`);
    });

    // ✅ مغادرة غرفة
    socket.on("leaveChat", (chatId) => {
      if (!chatId) return;
      socket.leave(chatId);
      console.log(`Socket ${socket.id} left chat ${chatId}`);
    });

    // ✅ إرسال رسالة
    socket.on("sendMessage", async ({ chatId, content, media }) => {
      try {
        if (!socket.userId) return console.warn("sendMessage: user not registered on socket");
        if (!chatId || (!content && !media)) return;

        const message = await Message.create({
          chat: chatId,
          sender: socket.userId,
          content: content || "",
          media: media || undefined,
        });

        await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

        const populatedMessage = await Message.findById(message._id)
          .populate("sender", "username avatar");

        io.to(chatId).emit("newMessage", populatedMessage);

        const chat = await Chat.findById(chatId).populate("users", "_id");
        if (chat && Array.isArray(chat.users)) {
          for (const user of chat.users) {
            const targetId = user._id.toString();
            if (targetId === socket.userId) continue;

            const notif = await Notification.create({
              user: targetId,
              fromUser: socket.userId,
              type: "message",
              message: `${populatedMessage.sender.username} أرسل لك رسالة جديدة`,
              chat: chatId,
            });

            const populatedNotif = await Notification.findById(notif._id)
              .populate("fromUser", "username avatar");

            const targetSocketId = onlineUsers.get(targetId);
            if (targetSocketId) {
              io.to(targetSocketId).emit("receive_notification", populatedNotif);
            }
          }
        }
      } catch (err) {
        console.error("sendMessage error:", err);
      }
    });

    // ✅ إشعار بنشر منشور جديد
    socket.on("newPost", async ({ postId, authorName }) => {
      try {
        if (!socket.userId) return;

        for (const [userId, sId] of onlineUsers.entries()) {
          if (String(userId) === String(socket.userId)) continue;

          const notif = await Notification.create({
            user: userId,
            fromUser: socket.userId,
            type: "post",
            message: `${authorName} نشر منشور جديد`,
            post: postId,
          });

          const populatedNotif = await Notification.findById(notif._id)
            .populate("fromUser", "username avatar");

          io.to(sId).emit("receive_notification", populatedNotif);
        }
      } catch (err) {
        console.error("newPost error:", err);
      }
    });

    // ✅ التعليقات (تحديث لحظي)
    socket.on("newComment", async ({ postId, comment }) => {
      try {
        if (!socket.userId) return;
        io.emit("receive_comment", { postId, comment });
      } catch (err) {
        console.error("newComment error:", err);
      }
    });
    // ✅ إضافة like لحظي
    socket.on("likePost", async ({ postId }) => {
      try {
        if (!socket.userId) return;

        // تحديث عدد اللايكات في الـ DB
        const post = await Post.findById(postId);
        if (!post) return;

        post.likes = (post.likes || 0) + 1;
        await post.save();

        // emit لجميع المتصلين أو يمكن emit فقط لمن يهتم بالبوست
        io.emit("postLiked", {
          postId,
          likes: post.likes,
          userId: socket.userId,
        });

      } catch (err) {
        console.error("likePost error:", err);
      }
    });


    // 🔌 عند فصل الاتصال
    socket.on("disconnect", () => {
      try {
        for (const [userId, sId] of onlineUsers.entries()) {
          if (sId === socket.id) {
            onlineUsers.delete(userId);
            console.log(`User disconnected: ${userId}`);
            break;
          }
        }
      } catch (err) {
        console.error("disconnect error:", err);
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

export const sendNotificationToUser = async (userId, notificationObj) => {
  try {
    const sId = onlineUsers.get(String(userId));
    if (sId && io) {
      io.to(sId).emit("receive_notification", notificationObj);
      return true;
    }
    return false;
  } catch (err) {
    console.error("sendNotificationToUser error:", err);
    return false;
  }
};
