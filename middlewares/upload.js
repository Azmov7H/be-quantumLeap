import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "quantumleap/posts", // اسم الفولدر داخل Cloudinary
    allowed_formats: ["jpg", "png", "jpeg", "gif", "webp"],
  },
});

const upload = multer({ storage });

export default upload;
