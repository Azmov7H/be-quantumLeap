// models/Notification.js
import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // recipient
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // actor
  type: { type: String, enum: ["message", "post", "follow", "like", "comment"], required: true },
  message: { type: String, required: true },
  chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  read: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
