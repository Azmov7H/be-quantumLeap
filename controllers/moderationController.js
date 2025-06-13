import Post from "../models/Post.js";

// Approve a post
export const approvePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, { status: "approved" }, { new: true });
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Reject a post
export const rejectPost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, { status: "rejected" }, { new: true });
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get pending posts for moderation
export const getPendingPosts = async (req, res) => {
  try {
    const posts = await Post.find({ status: "pending" }).populate("author", "username");
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
