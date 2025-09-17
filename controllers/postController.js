import Post from "../models/Post.js";
import { cloudinary } from "../utils/multerCloudinary.js";
import multer from "multer";

// Multer storage + Cloudinary
import { CloudinaryStorage } from "multer-storage-cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "quantumleap/posts",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

export const upload = multer({ storage });

// Create post
export const createPost = async (req, res) => {
  try {
    let imageUrl = null;
    if (req.file) imageUrl = req.file.path;

    const post = await Post.create({
      title: req.body.title,
      summary: req.body.summary,
      content: req.body.content,
      author: req.user.id,
      status: "pending",
      image: imageUrl,
    });

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get all approved posts
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find({ status: "approved" }).populate("author", "username");
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get single post
export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("author", "username");
    if (!post) return res.status(404).json({ msg: "Post not found" });
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Update post
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    if (req.body.title) post.title = req.body.title;
    if (req.body.summary) post.summary = req.body.summary;
    if (req.body.content) post.content = req.body.content;
    if (req.file) post.image = req.file.path;

    await post.save();
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Delete post
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    await post.deleteOne();
    res.status(200).json({ msg: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
