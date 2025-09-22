import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // المستقبل
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // المرسل
    type: { type: String, enum: ["message", "post"], required: true },
    message: { type: String, required: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" }, // لو إشعار رسالة
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" }, // لو إشعار بوست
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
