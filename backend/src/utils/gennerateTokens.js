import jwt from "jsonwebtoken";
import {envConfig} from "../config/env.config.js";

export const getAccessToken = async(userId,email, role, sid)=>{
    
    return jwt.sign({
        userId:userId,
        email,
        role,
        sid,
    },envConfig.JWT_SECRET,{
        expiresIn:"15m",
    });
};

export const getRefreshToken = async(userId,email,role,sid)=>{
    return jwt.sign({
        userId:userId,
        email,
        role,
        sid
    },envConfig.JWT_SECRET,{
        expiresIn:"1d"
    });
};