import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const validateInput = (schema) => {
  return asyncHandler(async (req, _, next) => {
    
    const hasRequestParts =
      schema.shape &&
      (schema.shape.body || schema.shape.query || schema.shape.params);

    const dataToValidate = hasRequestParts
      ? { body: req.body, query: req.query, params: req.params }
      : req.body;

    const result = await schema.safeParseAsync(dataToValidate);

    
    if (!result.success) {
      const issues = result.error?.issues || result.error?.errors || [];
      const errors = issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      throw new ApiError(400, "Validation Error", errors);
    }

    
    if (hasRequestParts) {
      if (result.data.body !== undefined) req.body = result.data.body;
      if (result.data.query !== undefined) req.query = result.data.query;
      if (result.data.params !== undefined) req.params = result.data.params;
    } else {
      req.body = result.data;
    }

    next();
  });
};




