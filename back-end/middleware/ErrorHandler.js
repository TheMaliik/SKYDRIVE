const ErrorResponse = require("../utils/ErrorResponse");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  //bad id
  if (err.name === "CastError") {
    error = new ErrorResponse(`Resource not found with id `, 404);
  }

  //mongoose duplicate value
  if (err.code === 11000) {
    error = new ErrorResponse("Duplicate field entered", 400);
  }


  res
    .status(error.statusCode || 500)
    .json({ success: false, error: error.message });
};

module.exports = errorHandler;