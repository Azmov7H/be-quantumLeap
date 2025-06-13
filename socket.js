import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/User.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // You can limit to your frontend origin in production
      methods: ["GET", "POST"],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error("Authentication error"));
      }
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    // Join user to their personal room (for private messaging)
    socket.join(socket.user._id.toString());

    // Listen for sending messages
    socket.on("send_message", (data) => {
      /*
        data = {
          chatId: String,
          content: String,
          recipients: [userId1, userId2, ...]
        }
      */
      // Broadcast message to all recipients' rooms
      data.recipients.forEach((recipientId) => {
        io.to(recipientId).emit("receive_message", {
          chatId: data.chatId,
          sender: socket.user._id,
          content: data.content,
          createdAt: new Date(),
        });
      });
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.username}`);
    });
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
