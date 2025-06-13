import Post from "../models/Post.js";

// Create post
export const createPost = async (req, res) => {
  try {
    const post = await Post.create({
      ...req.body,
      author: req.user.id,
      status: "pending",
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
