import postService from "../services/postService.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

export const createPost = async (req, res) => {
  try {
    const post = await postService.createPost(req.user._id, req.body, req.file);
    return successResponse(res, post, "Post created", 201);
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500, err);
  }
};

export const getPosts = async (req, res) => {
  try {
    const posts = await postService.getPosts();
    return successResponse(res, posts);
  } catch (err) {
    return errorResponse(res, err.message, 500, err);
  }
};

export const getPost = async (req, res) => {
  try {
    const post = await postService.getPostById(req.params.id);
    return successResponse(res, post);
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500, err);
  }
};

export const updatePost = async (req, res) => {
  try {
    const post = await postService.updatePost(
      req.params.id,
      req.user._id,
      req.user.role,
      req.body,
      req.file
    );
    return successResponse(res, post);
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500, err);
  }
};

export const deletePost = async (req, res) => {
  try {
    const result = await postService.deletePost(req.params.id, req.user._id, req.user.role);
    return successResponse(res, result);
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500, err);
  }
};

export const toggleLikePost = async (req, res) => {
  try {
    const likes = await postService.toggleLike(req.params.id, req.user._id, req.user);
    return successResponse(res, likes);
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500, err);
  }
};

export const getPostLikes = async (req, res) => {
  try {
    const count = await postService.getPostLikes(req.params.id);
    return successResponse(res, count);
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500, err);
  }
};

export const addComment = async (req, res) => {
  try {
    const comment = await postService.addComment(req.params.id, req.user._id, req.body.content);
    return successResponse(res, comment, "Comment added", 201);
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500, err);
  }
};

export const getComments = async (req, res) => {
  try {
    const comments = await postService.getComments(req.params.id);
    return successResponse(res, comments);
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500, err);
  }
};
