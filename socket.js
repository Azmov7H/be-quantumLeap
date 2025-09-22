// socket.js
import { Server } from "socket.io"
import Notification from "./models/Notification.js"
import Message from "./models/Message.js"
import Chat from "./models/Chat.js"

let io
const onlineUsers = new Map()

export const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*", credentials: true },
  })

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id)

    // 🟢 تسجيل المستخدم
    socket.on("user_connected", (userId) => {
      onlineUsers.set(userId, socket.id)
      socket.userId = userId
      console.log("📌 Online Users:", onlineUsers)
    })

    // 🟢 دخول غرفة شات
    socket.on("joinChat", (chatId) => {
      socket.join(chatId)
      console.log(`👥 User joined chat ${chatId}`)
    })

    // 🟢 إرسال رسالة
    socket.on("sendMessage", async ({ chatId, content }) => {
      try {
        if (!socket.userId) return

        const message = await Message.create({
          chat: chatId,
          sender: socket.userId,
          content,
        })

        await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id })

        const populatedMessage = await Message.findById(message._id)
          .populate("sender", "username profileImage")

        io.to(chatId).emit("newMessage", populatedMessage)

        // إشعار
        const chat = await Chat.findById(chatId).populate("users", "_id")
        for (const user of chat.users) {
          if (user._id.toString() !== socket.userId) {
            const notif = await Notification.create({
              user: user._id,
              fromUser: socket.userId,
              type: "message",
              message: "New message",
              chat: chatId,
            })

            const populatedNotif = await Notification.findById(notif._id)
              .populate("fromUser", "username profileImage")

            const socketId = onlineUsers.get(user._id.toString())
            if (socketId) {
              io.to(socketId).emit("receive_notification", populatedNotif)
            }
          }
        }
      } catch (err) {
        console.error("❌ sendMessage error:", err)
      }
    })

    // 🟢 نشر بوست
    socket.on("newPost", async ({ postId, username }) => {
      try {
        if (!socket.userId) return

        // مثال: لكل الناس (ممكن تخصصها للمتابعين فقط)
        const notif = await Notification.create({
          user: socket.userId,
          fromUser: socket.userId,
          type: "post",
          message: `${username} نشر منشور جديد`,
          post: postId,
        })

        const populatedNotif = await Notification.findById(notif._id)
          .populate("fromUser", "username profileImage")

        io.emit("receive_notification", populatedNotif)
      } catch (err) {
        console.error("❌ newPost error:", err)
      }
    })

    // 🟢 قطع الاتصال
    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id)
      onlineUsers.delete(socket.userId)
    })
  })
}

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!")
  return io
}
