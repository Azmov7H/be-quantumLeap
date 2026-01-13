// models/Message.js
import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema({
  url: String,
  public_id: String,
  type: { type: String, enum: ["image", "file"], default: "image" }
}, { _id: false });

const MessageSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, default: "" },
  media: MediaSchema,
  status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent"
  },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

// Index for fetching messages of a chat sorted by time
MessageSchema.index({ chat: 1, createdAt: -1 });

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);
