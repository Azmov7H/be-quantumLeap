import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cloudinary from "cloudinary";

// Cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Register new user
export const register = async (req, res) => {
  try {
    const { username, email, password, profileImage } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "Email already in use" });

    const hash = await bcrypt.hash(password, 10);

    let uploadedImage = null;
    if (profileImage) {
      const result = await cloudinary.v2.uploader.upload(profileImage, {
        folder: "users",
      });
      uploadedImage = result.secure_url;
    }

    const user = await User.create({
      username,
      email,
      password: hash,
      profileImage: uploadedImage || undefined,
    });

    res.status(201).json({ msg: "User registered successfully", user });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({ token, user });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Update profile (username, password, profileImage)
export const updateProfile = async (req, res) => {
  try {
    const { username, password, profileImage } = req.body;
    const updates = {};

    if (username) updates.username = username;
    if (password) updates.password = await bcrypt.hash(password, 10);

    if (profileImage) {
      const result = await cloudinary.v2.uploader.upload(profileImage, {
        folder: "users",
      });
      updates.profileImage = result.secure_url;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    }).select("-password");

    res.status(200).json({ msg: "Profile updated", user });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
