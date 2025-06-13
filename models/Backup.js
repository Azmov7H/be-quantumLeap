import mongoose from "mongoose";

const backupSchema = new mongoose.Schema(
  {
    data: { type: mongoose.Schema.Types.Mixed, required: true }, // Store any kind of data (posts, users, etc.)
    backupDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Backup", backupSchema);
