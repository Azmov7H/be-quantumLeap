import Post from "../models/Post.js";

// Approve a post
export const approvePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );
    if (!post) return res.status(404).json({ msg: "Post not found" });
    res.status(200).json({ msg: "Post approved", post });
  } catch (err) {
    console.error("❌ approvePost error:", err);
    res.status(500).json({ msg: err.message });
  }
};

// Reject a post
export const rejectPost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );
    if (!post) return res.status(404).json({ msg: "Post not found" });
    res.status(200).json({ msg: "Post rejected", post });
  } catch (err) {
    console.error("❌ rejectPost error:", err);
    res.status(500).json({ msg: err.message });
  }
};

// Get all pending posts
export const getPendingPosts = async (req, res) => {
  try {
    const posts = await Post.find({ status: "pending" }).populate("author", "username profileImage");
    res.status(200).json(posts);
  } catch (err) {
    console.error("❌ getPendingPosts error:", err);
    res.status(500).json({ msg: err.message });
  }
};
