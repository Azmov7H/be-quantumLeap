import Post from "../models/Post.js";

// Create post
export const createPost = async (req, res) => {
  try {
    let imageUrl = req.file?.path || null;
    const post = await Post.create({
      title: req.body.title,
      summary: req.body.summary,
      content: req.body.content,
      author: req.user.id,
      status: "pending",
      image: imageUrl
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
// إضافة لايك أو إزالة لايك
export const toggleLikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const userId = req.user.id;
    const index = post.likes.indexOf(userId);

    if (index === -1) {
      post.likes.push(userId); // إضافة لايك
    } else {
      post.likes.splice(index, 1); // إزالة لايك
    }

    await post.save();
    res.status(200).json(post.likes);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// إضافة كومنت
export const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const comment = {
      user: req.user.id,
      content
    };

    post.comments.push(comment);
    await post.save();

    // جلب التعليقات مع بيانات المستخدم
    const populatedPost = await Post.findById(req.params.id).populate("comments.user", "username profileImage");
    res.status(201).json(populatedPost.comments);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get comments for a specific post
export const getComments = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("comments.user", "username profileImage"); // جلب بيانات كل مستخدم
    if (!post) return res.status(404).json({ msg: "Post not found" });

    res.status(200).json(post.comments);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};