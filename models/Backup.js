// models/Backup.js
import mongoose from "mongoose";

const BackupSchema = new mongoose.Schema({
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  backupDate: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Backup || mongoose.model("Backup", BackupSchema);
