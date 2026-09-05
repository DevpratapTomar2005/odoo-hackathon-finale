import { ApiError } from "../utils/ApiError.js";
import {envConfig} from "../config/env.config.js";


export const globalErrorHandler = (err, req, res, next) => {
  let error = err;

  if (error.name === "TokenExpiredError") {
    error = new ApiError(
      401,
      "Token expired",
      error.stack
    );
  }
  else if (!(error instanceof ApiError)) {
    error = new ApiError(
      error.statusCode || 500,
      error.message || "Internal Server Error",
      error.stack,
    );
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    data: error.data,
  };

  if (envConfig.NODE_ENV !== "production") {
    response.stack = error.stack;
  }

  console.error(error);

  return res.status(error.statusCode).json(response);
};