import Post from "../models/Post.js";
import Notification from "../models/Notification.js"; // 🟢 إضافة الموديل
import User from "../models/User.js"; // 🟢 عشان نجيب باقي اليوزرز
import { getIO } from "../socket.js"; // 🟢 عشان نرسل إشعارات لحظياً

// Create post
export const createPost = async (req, res) => {
  try {
    let imageUrl = req.file?.path || null;
    const post = await Post.create({
      title: req.body.title,
      summary: req.body.summary,
      content: req.body.content,
      author: req.user.id,
      status: "approved",
      image: imageUrl
    });

    // 🟢 جلب بيانات صاحب البوست
    const author = await User.findById(req.user.id).select("username");

    // 🟢 إنشاء إشعار لكل المستخدمين (ممكن تخصها للـ followers بعدين)
    const users = await User.find({ _id: { $ne: req.user.id } }).select("_id");
    for (const user of users) {
      const notif = await Notification.create({
        user: user._id,
        fromUser: req.user.id,
        type: "post",
        message: `${author.username} نشر منشور جديد`,
        post: post._id,
      });

      // ابعت الإشعار لحظياً
      getIO().emit("receive_notification", await Notification.findById(notif._id).populate("fromUser", "username profileImage"));
    }

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get all approved posts
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find({ status: "approved" })
      .populate("author", "username profileImage"); // رجع اسم + صورة

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
    const post = await Post.findById(req.params.id).populate("author", "username");
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const userId = req.user.id;
    const index = post.likes.indexOf(userId);

    let action;
    if (index === -1) {
      post.likes.push(userId); // إضافة لايك
      action = "like";
    } else {
      post.likes.splice(index, 1); // إزالة لايك
      action = "unlike";
    }

    await post.save();

    // 🟢 لو اللي عمل لايك مش نفس صاحب البوست → ابعت إشعار
    if (action === "like" && String(post.author._id) !== userId) {
      const fromUser = await User.findById(userId).select("username profileImage");

      const notif = await Notification.create({
        user: post.author._id,   // صاحب البوست
        fromUser: userId,        // اللي عمل لايك
        type: "like",
        message: `${fromUser.username} عمل لايك على منشورك`,
        post: post._id,
      });

      // إرسال لحظي عبر socket.io
      getIO().emit(
        "receive_notification",
        await Notification.findById(notif._id).populate("fromUser", "username profileImage")
      );
    }

    res.status(200).json(post.likes);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// إضافة كومنت
export const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.id).populate("author", "username");
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const comment = { user: req.user.id, content };
    post.comments.push(comment);
    await post.save();

    // 🟢 لو المعلق مش نفس صاحب البوست → ابعت إشعار
    if (String(post.author._id) !== req.user.id) {
      const fromUser = await User.findById(req.user.id).select("username profileImage");

      const notif = await Notification.create({
        user: post.author._id,   // صاحب البوست
        fromUser: req.user.id,   // المعلق
        type: "comment",
        message: `${fromUser.username} علق على منشورك`,
        post: post._id,
      });

      getIO().emit(
        "receive_notification",
        await Notification.findById(notif._id).populate("fromUser", "username profileImage")
      );
    }

    // رجّع التعليقات مع بيانات المستخدمين
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
