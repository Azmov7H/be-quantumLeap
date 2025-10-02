// utils/multerCloudinary.js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: (req, file) => {
      // route-specific folder logic (optional)
      if (req.baseUrl.includes("posts")) return "quantumleap/posts";
      if (req.baseUrl.includes("auth")) return "quantumleap/profiles";
      return "quantumleap/uploads";
    },
    allowed_formats: ["jpg", "png", "jpeg", "webp", "gif"],
    transformation: [{ quality: "auto" }, { fetch_format: "auto" }]
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  if (allowed.test(file.mimetype) && allowed.test(file.originalname.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"), false);
  }
};

export const uploadCloud = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB
