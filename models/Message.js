// models/Message.js
import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema({
  url: String,
  public_id: String,
  type: { type: String, enum: ["image", "file"], default: "image" }
}, { _id: false });

const MessageSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, default: "" },
  media: MediaSchema
}, { timestamps: true });

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);
