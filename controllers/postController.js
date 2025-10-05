// controllers/postController.js
import Post from "../models/Post.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { sendNotificationToUser } from "../socket.js";
import { getIO } from "../socket.js";




/// cerate a new post

export const createPost = async (req, res) => {
  try {
    const imageObj = req.file ? { url: req.file.path, public_id: req.file.filename || req.file.public_id } : null;

    const post = await Post.create({
      title: req.body.title,
      summary: req.body.summary,
      content: req.body.content,
      author: req.user._id,
      status: "approved",
      image: imageObj
    });

    // notify followers only (efficient): get followers of author
    const author = await User.findById(req.user._id).select("username followers");
    const followers = author.followers || [];

    for (const f of followers) {
      const notif = await Notification.create({
        user: f,
        fromUser: req.user._id,
        type: "post",
        message: `${author.username} نشر منشور جديد`,
        post: post._id
      });

      const populatedNotif = await notif.populate("fromUser", "username avatar");
      await sendNotificationToUser(f, populatedNotif);
    }

    return res.status(201).json(post);
  } catch (err) {
    console.error("createPost error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};


///get all posts (only approved)
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find({ status: "approved" })
      .populate("author", "username profileImage")
      .sort({ createdAt: -1 });
    return res.status(200).json(posts);
  } catch (err) {
    console.error("getPosts error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};



/// get  a single post by id
export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("author", "username avatar");
    if (!post) return res.status(404).json({ msg: "Post not found" });
    return res.status(200).json(post);
  } catch (err) {
    console.error("getPost error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};


///update a post

export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    if (String(post.author) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Not allowed" });
    }

    if (req.body.title) post.title = req.body.title;
    if (req.body.summary) post.summary = req.body.summary;
    if (req.body.content) post.content = req.body.content;
    if (req.file) post.image = { url: req.file.path, public_id: req.file.filename || req.file.public_id };

    await post.save();
    return res.status(200).json(post);
  } catch (err) {
    console.error("updatePost error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};


/// delete a post

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    if (String(post.author) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Not allowed" });
    }

    // Optionally: remove image from Cloudinary using public_id (if exists)
    if (post.image && post.image.public_id) {
      try {
        await import("../config/cloudinary.js").then(m => m.default.uploader.destroy(post.image.public_id));
      } catch (e) { console.warn("Failed to remove cloudinary image", e); }
    }

    await post.deleteOne();
    return res.status(200).json({ msg: "Post deleted" });
  } catch (err) {
    console.error("deletePost error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};


/// Like or unLike a post
export const toggleLikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("author", "username avatar");
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const userId = req.user._id.toString();
    const index = post.likes.findIndex(id => id.toString() === userId);
    let action;
    if (index === -1) {
      post.likes.push(req.user._id);
      action = "like";
    } else {
      post.likes.splice(index, 1);
      action = "unlike";
    }
    await post.save();

    if (action === "like" && String(post.author._id) !== userId) {
      const notif = await Notification.create({
        user: post.author._id,
        fromUser: req.user._id,
        type: "like",
        message: `${req.user.username || "Someone"} عمل لايك على منشورك`,
        post: post._id
      });
      const populatedNotif = await notif.populate("fromUser", "username avatar");
      await sendNotificationToUser(String(post.author._id), populatedNotif);
    }

    return res.status(200).json(post.likes);
  } catch (err) {
    console.error("toggleLikePost error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};


/// add comment to a post
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    // إضافة التعليق مباشرة داخل البوست
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const newComment = {
      user: req.user._id,
      content: text,
    };

    post.comments.unshift(newComment); // نضيف التعليق في البداية
    await post.save();

    // تعبئة بيانات المستخدم
    const populatedComment = await Post.populate(newComment, {
      path: "user",
      select: "username profileImage",
    });

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error("❌ Error in addComment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

///get all comments for a post
export const getComments = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("comments.user", "username profileImage");
    if (!post) return res.status(404).json({ msg: "Post not found" });
    return res.status(200).json(post.comments);
  } catch (err) {
    console.error("getComments error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};
