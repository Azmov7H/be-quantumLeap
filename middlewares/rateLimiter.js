import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100, // 100 request لكل IP في الـ window
  message: "Too many requests from this IP, please try again later.",
});
