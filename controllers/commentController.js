import Comment from "../models/Comment.js";

// Create comment
export const addComment = async (req, res) => {
  try {
    const comment = await Comment.create({ content: req.body.content, author: req.user.id, post: req.body.postId });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get comments for a post
export const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId }).populate("author", "username");
    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
