// socket.js
import { Server } from "socket.io";
import Notification from "./models/Notification.js";

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

    // استقبال إشعار جديد من السيرفر
    socket.on("send_notification", async ({ userId, message, fromUser }) => {
      // حفظ الإشعار في قاعدة البيانات
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
