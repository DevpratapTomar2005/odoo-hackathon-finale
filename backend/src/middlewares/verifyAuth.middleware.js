import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { envConfig } from "../config/env.config.js";

export const verifyAuth = asyncHandler(async(req,res,next) => {
    const accessToken = req.cookies?.accessToken || req.header("Authorization")?.split(" ")[1];

    if(!accessToken){
        throw new ApiError(401,"Unauthorized access");
    }

    const decodedToken = jwt.verify(accessToken,envConfig.JWT_SECRET);

    if(!decodedToken){
        throw new ApiError(401,"Invalid token");
    }


    req.user = decodedToken;

    next();
})