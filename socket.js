// socket.js
import { Server } from "socket.io";
import Notification from "./models/Notification.js";
import Message from "./models/Message.js";
import Chat from "./models/Chat.js";

let io;
export const onlineUsers = new Map(); // userId (string) -> socketId (string)

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    // ---------------------------
    // تسجيل اليوزر (client يبعت userId بعد الفتح)
    // ---------------------------
    socket.on("user_connected", (userId) => {
      try {
        if (!userId) return;
        onlineUsers.set(String(userId), socket.id);
        socket.userId = String(userId);
        console.log(`📌 user_connected: ${userId} -> ${socket.id}`);
      } catch (err) {
        console.error("❌ user_connected error:", err);
      }
    });

    // ---------------------------
    // دخول غرفة شات
    // ---------------------------
    socket.on("joinChat", (chatId) => {
      try {
        if (!chatId) return;
        socket.join(chatId);
        console.log(`👥 Socket ${socket.id} joined chat ${chatId}`);
      } catch (err) {
        console.error("❌ joinChat error:", err);
      }
    });

    // ---------------------------
    // إرسال رسالة عبر السوكت (يحفظ رسالة + يحدث latestMessage + يبعث إيميت للشات)
    // ويولد Notification لكل عضو آخر في الشات ويرسلها لحظياً إن كانوا online
    // ---------------------------
    socket.on("sendMessage", async ({ chatId, content }) => {
      try {
        if (!socket.userId) {
          console.warn("⚠️ sendMessage: socket has no userId (not registered)");
          return;
        }
        if (!chatId || !content) {
          console.warn("⚠️ sendMessage: missing chatId or content");
          return;
        }

        // 1. حفظ الرسالة
        const message = await Message.create({
          chat: chatId,
          sender: socket.userId,
          content,
        });

        // 2. تحديث آخر رسالة في الشات
        await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

        // 3. جلب الرسالة populated
        const populatedMessage = await Message.findById(message._id)
          .populate("sender", "username profileImage");

        // 4. إرسال الرسالة لكل الموجودين في الغرفة (chat room)
        io.to(chatId).emit("newMessage", populatedMessage);

        // 5. إنشاؤ إشعار (Notification) لكل عضو في الشات غير المرسل، وإرسال لحظي لكل Online
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
              .populate("fromUser", "username profileImage");

            // ارسال لحظي فقط للمستخدم المستهدف لو Online
            const targetSocketId = onlineUsers.get(targetId);
            if (targetSocketId) {
              io.to(targetSocketId).emit("receive_notification", populatedNotif);
            } else {
              // مش Online => الاشعار محفوظ في DB (تم بالفعل)
              console.log(`⚪ User ${targetId} not online — notification saved`);
            }
          }
        }
      } catch (err) {
        console.error("❌ sendMessage error:", err);
      }
    });

    // ---------------------------
    // نشر بوست لحظي + تخزين إشعارات (هنا بنبعت لكل اليوزرز الاخرين اللي Online)
    // لو تحب تغيّرها للـ followers تبقى logic مختلفة (حسب هيكل الـ User)
    // ---------------------------
    socket.on("newPost", async ({ postId, username }) => {
      try {
        if (!socket.userId) {
          console.warn("⚠️ newPost: socket has no userId (not registered)");
          return;
        }

        // إرسال إشعار لكل Online Users باستثناء صاحب البوست
        for (const [userId, sId] of onlineUsers.entries()) {
          if (String(userId) === String(socket.userId)) continue;

          const notif = await Notification.create({
            user: userId,
            fromUser: socket.userId,
            type: "post",
            message: `${username} نشر منشور جديد`,
            post: postId,
          });

          const populatedNotif = await Notification.findById(notif._id)
            .populate("fromUser", "username profileImage");

          io.to(sId).emit("receive_notification", populatedNotif);
        }

        // ملاحظة: المستخدمين غير الـ Online لديهم إشعار محفوظ في DB
      } catch (err) {
        console.error("❌ newPost error:", err);
      }
    });

    // ---------------------------
    // فصل الاتصال
    // ---------------------------
    socket.on("disconnect", () => {
      try {
        // نحذف المفتاح المرتبط بالـ socket.id
        for (const [userId, sId] of onlineUsers.entries()) {
          if (sId === socket.id) {
            onlineUsers.delete(userId);
            console.log(`❌ User disconnected: ${userId} (socket ${socket.id})`);
            break;
          }
        }
      } catch (err) {
        console.error("❌ disconnect error:", err);
      }
    });
  });

  return io;
};

// دالة للحصول على io من بقية الملفات
export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};

// دالة مساعدة لإرسال إشعار لمستخدم معين (يستعملها الكنترولرز لو حبّيت)
export const sendNotification = async (userId, notificationObj) => {
  try {
    const socketId = onlineUsers.get(String(userId));
    if (socketId && io) {
      io.to(socketId).emit("receive_notification", notificationObj);
      console.log(`📨 Sent notification to user ${userId}`);
    } else {
      console.log(`⚪ User ${userId} not online — notification saved in DB only`);
    }
  } catch (err) {
    console.error("❌ sendNotification error:", err);
  }
};
