// controllers/authController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

const signToken = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ msg: "Missing fields" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "Email already in use" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({ username, email, password: hash });

    const userObj = user.toObject();
    delete userObj.password;

    const token = signToken(user);

    return res.status(201).json({ msg: "User registered", user: userObj, token });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ msg: "Invalid credentials" });

    const token = signToken(user);
    const userObj = user.toObject();
    delete userObj.password;

    return res.status(200).json({ token, user: userObj });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    return res.status(200).json(user);
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const updateFields = {};
    const { username, email, password, bio, facebook, linkedin, whatsapp } = req.body;

    if (username) updateFields.username = username;
    if (email) updateFields.email = email;
    if (bio !== undefined) updateFields.bio = bio;
    if (facebook || linkedin || whatsapp) updateFields.social = {
      facebook: facebook || req.user.social?.facebook || "",
      linkedin: linkedin || req.user.social?.linkedin || "",
      whatsapp: whatsapp || req.user.social?.whatsapp || ""
    };

    if (password) updateFields.password = await bcrypt.hash(password, 10);

    // handle file upload (req.file comes from multer)
    if (req.file && req.file.path) {
      // multer-storage-cloudinary already uploaded and provided path + filename/public_id
      updateFields.avatar = {
        url: req.file.path,
        public_id: req.file.filename || req.file.public_id
      };
    }

    const updated = await User.findByIdAndUpdate(req.user._id, { $set: updateFields }, { new: true, runValidators: true }).select("-password");
    return res.status(200).json({ msg: "Profile updated", user: updated });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};
