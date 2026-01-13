import { Server } from "socket.io";
import Notification from "./models/Notification.js";
import Message from "./models/Message.js";
import Chat from "./models/Chat.js";
import Post from "./models/Post.js";

let io;
export const onlineUsers = new Map(); // userId -> socketId

/**
 * Socket.io Module - Refactored for Room-based performance
 */
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // 🧠 Authenticate and Join User Room
    socket.on("user_connected", (userId) => {
      try {
        if (!userId) return;
        const userIdStr = String(userId);

        socket.userId = userIdStr;
        socket.join(`user:${userIdStr}`); // Private room for targeted notifications

        console.log(`User connected to private room: user:${userIdStr}`);

        // Optional global online tracking
        onlineUsers.set(userIdStr, socket.id);
      } catch (err) {
        console.error("user_connected error:", err);
      }
    });

    // 💬 Chat Room Management
    socket.on("joinChat", (chatId) => {
      if (!chatId) return;
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined chat room: ${chatId}`);
    });

    socket.on("leaveChat", (chatId) => {
      if (!chatId) return;
      socket.leave(chatId);
      console.log(`Socket ${socket.id} left chat room: ${chatId}`);
    });

    // ✉️ Message Handling (Logic moved to services, handler just broadcasts)
    // Note: The actual DB work is done in the API controllers now, 
    // but we keep these handlers for pure socket-only flow if needed.
    socket.on("sendMessage", async ({ chatId, content, media }) => {
      // Best Practice: Business logic should ideally stay in the API.
      // If messages are sent via Socket, we call the Service.
      try {
        if (!socket.userId) return;
        const msg = await chatService.sendMessage(socket.userId, { username: "User" }, chatId, content, media);
        // service.sendMessage already handles io.to(chatId).emit("newMessage", ...)
      } catch (err) {
        console.error("sendMessage socket error:", err);
      }
    });

    // 🧪 Research/Post Interactions
    socket.on("newComment", ({ postId, comment }) => {
      // Broadcast to all clients viewing the post or the global feed
      io.emit("receive_comment", { postId, comment });
    });

    socket.on("likePost", ({ postId, likes, userId }) => {
      // Broadcast like update to all
      io.emit("postLiked", { postId, likes, userId });
    });

    // ⌨️ Interaction Indicators
    socket.on("typing", (chatId) => {
      if (!chatId) return;
      socket.to(chatId).emit("typing", { chatId, userId: socket.userId });
    });

    socket.on("stop_typing", (chatId) => {
      if (!chatId) return;
      socket.to(chatId).emit("stop_typing", { chatId, userId: socket.userId });
    });

    // 🔌 Cleanup
    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        console.log(`User disconnected: ${socket.userId}`);
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

/**
 * Standardized Notification Delivery
 * Uses rooms instead of O(N) loops.
 */
export const sendNotificationToUser = async (userId, notificationObj) => {
  try {
    if (!io) return false;

    // Broadcast to user's private room (handles multiple tabs automatically)
    io.to(`user:${String(userId)}`).emit("receive_notification", notificationObj);
    return true;
  } catch (err) {
    console.error("sendNotificationToUser error:", err);
    return false;
  }
};
