export const successResponse = (res, data, message = "Success", statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

export const errorResponse = (res, message = "Server Error", statusCode = 500, error = null) => {
    if (error) console.error(`[Error] ${message}:`, error);
    return res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && error && { stack: error.stack }),
    });
};
