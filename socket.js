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

    // 🟢 المستخدم يتسجل كـ Online
    socket.on("user_connected", (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId; // نخزن اليوزر مع السوكيت
      console.log("📌 Online Users:", onlineUsers);
    });

    // 🟢 دخول غرفة شات
    socket.on("joinChat", (chatId) => {
      socket.join(chatId);
      console.log(`👥 User joined chat ${chatId}`);
    });

    // 🟢 إرسال رسالة
    socket.on("sendMessage", async ({ chatId, content }) => {
      try {
        if (!socket.userId) return;

        // 1- إنشاء الرسالة
        const message = await Message.create({
          chat: chatId,
          sender: socket.userId,
          content,
        });

        // 2- تحديث آخر رسالة بالشات
        await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

        // 3- Populate البيانات عشان تبان كاملة للفرونت
        const populatedMessage = await Message.findById(message._id)
          .populate("sender", "username profileImage");

        // 4- إرسال الرسالة لكل الناس في الشات
        io.to(chatId).emit("newMessage", populatedMessage);

        console.log("📩 Message sent:", populatedMessage);
      } catch (err) {
        console.error("❌ sendMessage error:", err);
      }
    });

    // 🟢 إرسال إشعار
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
