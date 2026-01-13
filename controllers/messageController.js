import chatService from "../services/chatService.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit, before } = req.query;
    const result = await chatService.getMessages(chatId, limit, before);
    return successResponse(res, result);
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500, err);
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const { chatId } = req.params;
    const message = await chatService.sendMessage(req.user._id, req.user, chatId, content, req.file);
    return successResponse(res, message, "Message sent", 201);
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500, err);
  }
};
