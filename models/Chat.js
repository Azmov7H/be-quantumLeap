// models/Chat.js
import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema({
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  latestMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" }
}, { timestamps: true });

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);
