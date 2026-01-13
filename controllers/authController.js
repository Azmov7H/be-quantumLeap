import authService from "../services/authService.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

export const register = async (req, res) => {
  try {
    const data = await authService.register(req.body);
    return successResponse(res, data, "User registered successfully", 201);
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500, err);
  }
};

export const login = async (req, res) => {
  try {
    const data = await authService.login(req.body);
    return successResponse(res, data, "Login successful");
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500, err);
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user._id);
    return successResponse(res, user);
  } catch (err) {
    return errorResponse(res, err.message, 500, err);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const updatedUser = await authService.updateProfile(req.user._id, req.body, req.file);
    return successResponse(res, updatedUser, "Profile updated successfully");
  } catch (err) {
    return errorResponse(res, err.message, 500, err);
  }
};
