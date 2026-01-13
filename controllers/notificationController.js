import notificationService from "../services/notificationService.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user._id);
    return successResponse(res, notifications);
  } catch (err) {
    return errorResponse(res, err.message, 500, err);
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user._id);
    return successResponse(res, result);
  } catch (err) {
    return errorResponse(res, err.message, 500, err);
  }
};
