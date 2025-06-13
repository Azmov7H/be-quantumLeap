// Global error handler
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    msg: err.message || "Something went wrong",
  });
};
