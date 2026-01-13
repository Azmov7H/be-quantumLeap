import userService from "../services/userService.js";
import authService from "../services/authService.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

// Get specific user profile (public)
export const getUserProfile = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return successResponse(res, user);
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500, err);
  }
};

// Get current user (same as authProfile)
export const getCurrentUser = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user._id);
    return successResponse(res, user);
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500, err);
  }
};

// Toggle Follow
export const followUser = async (req, res) => {
  try {
    const result = await userService.followUser(req.user._id.toString(), req.params.id);
    return successResponse(res, result);
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500, err);
  }
};

// Toggle Unfollow
export const unfollowUser = async (req, res) => {
  try {
    const result = await userService.unfollowUser(req.user._id.toString(), req.params.id);
    return successResponse(res, result);
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500, err);
  }
};

// Update Profile (Delegates to AuthService logic)
export const updateUserProfile = async (req, res) => {
  try {
    // Note: authService.updateProfile handles file processing if passed as req.file (which Multer/Cloudinary provides)
    // We assume the route now uses the correct uploadCloud middleware which puts file info in req.file.path/filename
    const updatedUser = await authService.updateProfile(req.user._id, req.body, req.file);
    return successResponse(res, { user: updatedUser }, "Profile updated successfully");
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500, err);
  }
};

