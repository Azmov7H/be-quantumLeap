import { Server } from "socket.io";
import Notification from "./models/Notification.js";
import Message from "./models/Message.js";
import Chat from "./models/Chat.js";

let io;
const onlineUsers = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*", credentials: true }, // عدّل حسب دومينك
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // تسجيل المستخدم عند الاتصال
    socket.on("user_connected", (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log("Online Users:", onlineUsers);
    });

    // 📌 الانضمام لغرفة شات
    socket.on("joinChat", (chatId) => {
      socket.join(chatId);
      console.log(`✅ User joined chat ${chatId}`);
    });

    // 📌 إرسال رسالة
    socket.on("sendMessage", async ({ chatId, content, sender }) => {
      try {
        const message = await Message.create({
          chat: chatId,
          sender,
          content,
        });

        // تحديث آخر رسالة في الشات
        await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

        // بث الرسالة لكل اللي في الغرفة
        io.to(chatId).emit("newMessage", message);

        console.log("📩 Message sent:", message);
      } catch (err) {
        console.error("❌ sendMessage error:", err);
      }
    });

    // استقبال إشعار جديد
    socket.on("send_notification", async ({ userId, message, fromUser }) => {
      const notif = await Notification.create({
        user: userId,
        message,
        fromUser: fromUser._id,
      });

      const socketId = onlineUsers.get(userId);
      if (socketId) {
        io.to(socketId).emit("receive_notification", {
          _id: notif._id,
          message: notif.message,
          fromUser,
          createdAt: notif.createdAt,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      onlineUsers.forEach((value, key) => {
        if (value === socket.id) onlineUsers.delete(key);
      });
    });
  });
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};
