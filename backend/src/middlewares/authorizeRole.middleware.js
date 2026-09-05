import { ApiError } from "../utils/ApiError.js";

export const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            throw new ApiError(403, "Unauthorized to access this resource");
        }
        next();
    }
}