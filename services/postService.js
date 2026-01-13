import Post from "../models/Post.js";
import Notification from "../models/Notification.js";
import { sendNotificationToUser, getIO } from "../socket.js";
import cloudinary from "../config/cloudinary.js";

class PostService {
    async createPost(userId, postData, file) {
        let imageUrl = "";
        if (file) {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: "posts",
            });
            imageUrl = result.secure_url;
        }

        const post = new Post({
            title: postData.title,
            summary: postData.summary,
            content: postData.content,
            image: imageUrl,
            author: userId,
        });

        await post.save();
        return post;
    }

    async getPosts() {
        // Only approved posts, sorted by date
        return await Post.find({ status: "approved" })
            .populate("author", "username profileImage")
            .sort({ createdAt: -1 })
            .lean();
    }

    async getPostById(postId) {
        const post = await Post.findById(postId)
            .populate("author", "username profileImage")
            .lean();
        if (!post) {
            const error = new Error("Post not found");
            error.statusCode = 404;
            throw error;
        }
        return post;
    }

    async updatePost(postId, userId, userRole, updateData, file) {
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error("Post not found");
            error.statusCode = 404;
            throw error;
        }

        if (String(post.author) !== String(userId) && userRole !== "admin") {
            const error = new Error("Not allowed");
            error.statusCode = 403;
            throw error;
        }

        if (updateData.title) post.title = updateData.title;
        if (updateData.summary) post.summary = updateData.summary;
        if (updateData.content) post.content = updateData.content;

        if (file) {
            // Optimistic: delete old image? 
            // Not implemented in original controller fully (only in delete), but good practice.
            // For now, just update.
            post.image = { url: file.path, public_id: file.filename || file.public_id };
        }

        await post.save();
        return post;
    }

    async deletePost(postId, userId, userRole) {
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error("Post not found");
            error.statusCode = 404;
            throw error;
        }

        if (String(post.author) !== String(userId) && userRole !== "admin") {
            const error = new Error("Not allowed");
            error.statusCode = 403;
            throw error;
        }

        if (post.image && post.image.public_id) {
            try {
                await cloudinary.uploader.destroy(post.image.public_id);
            } catch (e) { console.warn("Failed to remove cloudinary image", e); }
        }

        await post.deleteOne();
        return { msg: "Post deleted" };
    }

    async toggleLike(postId, userId, user) {
        const post = await Post.findById(postId).populate("author", "username profileImage");
        if (!post) {
            const error = new Error("Post not found");
            error.statusCode = 404;
            throw error;
        }

        const userIdStr = userId.toString();
        const index = post.likes.findIndex(id => id.toString() === userIdStr);
        let action = "unlike";

        if (index === -1) {
            post.likes.push(userId);
            action = "like";
        } else {
            post.likes.splice(index, 1);
        }
        await post.save();

        if (action === "like" && String(post.author._id) !== userIdStr) {
            try {
                const notif = await Notification.create({
                    user: post.author._id,
                    fromUser: userId,
                    type: "like",
                    message: `${user.username || "Someone"} liked your post`,
                    post: post._id
                });
                const populatedNotif = await notif.populate("fromUser", "username avatar");
                await sendNotificationToUser(String(post.author._id), populatedNotif);
            } catch (e) {
                console.error("Notification failed", e);
            }
        }

        // Real-time broadcast
        try {
            const io = getIO();
            io.emit("postLiked", { postId, likes: post.likes, userId: userIdStr });
        } catch (e) { /* ignore */ }

        return post.likes;
    }

    async getPostLikes(postId) {
        const post = await Post.findById(postId).populate("likes", "username profileImage");
        if (!post) {
            const error = new Error("Post not found");
            error.statusCode = 404;
            throw error;
        }
        return post.likes.length; // Original returned length.
    }

    async addComment(postId, userId, content) {
        if (!content) {
            const error = new Error("Comment content is required");
            error.statusCode = 400;
            throw error;
        }

        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error("Post not found");
            error.statusCode = 404;
            throw error;
        }

        const newComment = {
            user: userId,
            content
        };

        post.comments.unshift(newComment);
        await post.save();

        // Get the newly added comment (it's the first one now)
        const savedPost = await Post.findById(postId)
            .populate("comments.user", "username profileImage")
            .select({ comments: { $slice: 1 } })
            .lean();

        // Real-time broadcast
        try {
            const io = getIO();
            io.emit("receive_comment", { postId, comment: savedPost.comments[0] });
        } catch (e) { /* ignore */ }

        return savedPost.comments[0];
    }

    async getComments(postId) {
        const post = await Post.findById(postId)
            .populate("comments.user", "username profileImage")
            .select("comments")
            .lean();
        if (!post) {
            const error = new Error("Post not found");
            error.statusCode = 404;
            throw error;
        }
        return post.comments;
    }
}

export default new PostService();
