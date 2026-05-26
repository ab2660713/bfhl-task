function sendError(res, status, message, details) {
  return res.status(status).json({
    error: message,
    ...(details ? { details } : {})
  });
}

function notFound(req, res) {
  return sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return sendError(res, 400, "Request body must be valid JSON");
  }

  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((error) => error.message);
    return sendError(res, 400, "Validation failed", details);
  }

  if (err.name === "CastError") {
    return sendError(res, 400, "Invalid id");
  }

  console.error(err);
  return sendError(res, 500, "Server error");
}

module.exports = {
  errorHandler,
  notFound,
  sendError
};
