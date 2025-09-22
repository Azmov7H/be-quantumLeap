import { Server } from "socket.io";
import Notification from "./models/Notification.js";
import Message from "./models/Message.js";
import Chat from "./models/Chat.js";

let io;
const onlineUsers = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*", credentials: true },
  });

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    // 🟢 تسجيل اليوزر كـ Online
    socket.on("user_connected", (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      console.log("📌 Online Users:", onlineUsers);
    });

    // 🟢 دخول غرفة شات
    socket.on("joinChat", (chatId) => {
      socket.join(chatId);
      console.log(`👥 User joined chat ${chatId}`);
    });

    // 🟢 إرسال رسالة (DB + Real-time + Notification)
    socket.on("sendMessage", async ({ chatId, content }) => {
      try {
        if (!socket.userId) return;

        // 1- حفظ الرسالة
        const message = await Message.create({
          chat: chatId,
          sender: socket.userId,
          content,
        });

        // 2- تحديث آخر رسالة
        await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

        // 3- Populate الرسالة
        const populatedMessage = await Message.findById(message._id)
          .populate("sender", "username profileImage");

        // 4- إرسال الرسالة للأعضاء
        io.to(chatId).emit("newMessage", populatedMessage);

        // 5- إشعارات للطرف التاني
        const chat = await Chat.findById(chatId).populate("users", "_id");
        for (const user of chat.users) {
          if (user._id.toString() !== socket.userId) {
            const notif = await Notification.create({
              user: user._id,
              fromUser: socket.userId,
              type: "message",
              message: "New message",
              chat: chatId,
            });

            const socketId = onlineUsers.get(user._id.toString());
            if (socketId) {
              io.to(socketId).emit("receive_notification", {
                _id: notif._id,
                type: "message",
                fromUser: socket.userId,
                chatId: chatId,
                message: "New message",
                createdAt: notif.createdAt,
              });
            }
          }
        }

        console.log("📩 Message sent:", populatedMessage);
      } catch (err) {
        console.error("❌ sendMessage error:", err);
      }
    });

    // 🟢 إشعارات البوستات
    socket.on("newPost", async ({ postId, userId, username }) => {
      try {
        // مثال: تبعت لكل الناس (ممكن تخصصها لفولوورز بس)
        const notif = await Notification.create({
          user: userId,
          fromUser: userId,
          type: "post",
          message: `${username} نشر منشور جديد`,
          post: postId,
        });

        io.emit("receive_notification", {
          _id: notif._id,
          type: "post",
          fromUser: userId,
          postId,
          message: `${username} نشر منشور جديد`,
          createdAt: notif.createdAt,
        });
      } catch (err) {
        console.error("❌ newPost error:", err);
      }
    });

    // 🟢 قطع الاتصال
    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
      onlineUsers.delete(socket.userId);
    });
  });
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};
