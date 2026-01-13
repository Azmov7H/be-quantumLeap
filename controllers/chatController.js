import chatService from "../services/chatService.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

export const accessChat = async (req, res) => {
  try {
    const chat = await chatService.accessChat(req.user._id, req.body.userId);
    return successResponse(res, chat);
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500, err);
  }
};

export const getUserChats = async (req, res) => {
  try {
    const chats = await chatService.getUserChats(req.user._id);
    return successResponse(res, chats);
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500, err);
  }
};
