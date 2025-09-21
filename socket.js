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

    // 🟢 إرسال رسالة (DB + Real-time)
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
        chat.users.forEach(async (user) => {
          if (user._id.toString() !== socket.userId) {
            await Notification.create({
              user: user._id,
              message: `New message from ${socket.userId}`,
            });

            const socketId = onlineUsers.get(user._id.toString());
            if (socketId) {
              io.to(socketId).emit("receive_notification", {
                message: `New message from ${socket.userId}`,
                fromUser: socket.userId,
                createdAt: new Date(),
              });
            }
          }
        });

        console.log("📩 Message sent:", populatedMessage);
      } catch (err) {
        console.error("❌ sendMessage error:", err);
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
