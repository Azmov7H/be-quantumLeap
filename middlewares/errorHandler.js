// middlewares/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.stack || err);
  res.status(statusCode).json({
    msg: err.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};
