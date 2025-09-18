import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    profileImage: {
      type: String,
      default: "https://res.cloudinary.com/ddho5u074/image/upload/v1737200000/default-avatar.png",
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
