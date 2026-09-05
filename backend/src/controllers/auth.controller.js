import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { user, session } from "../db/schema.js";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../db/db.js";
import { envConfig } from "../config/env.config.js";
import { getAccessToken, getRefreshToken } from "../utils/gennerateTokens.js";
import { uuidv7 } from "uuidv7";
import crypto from "crypto";

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const [userExists] = await db.select().from(user).where(eq(user.email, email));
  if (!userExists) {
    throw new ApiError(400, "Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, userExists.password);
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid credentials");
  }

  const sid = uuidv7();

  const accessToken = await getAccessToken(
    userExists.id,
    userExists.email,
    userExists.role,
    sid,
  );
  const refreshToken = await getRefreshToken(
    userExists.id,
    userExists.email,
    userExists.role,
    sid,
  );

  const hashedRefreshToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  await db.insert(session).values({
    id: sid,
    userId: userExists.id,
    token: hashedRefreshToken,
    userAgent: req.headers["user-agent"] || "unknown",
    ip: req.ip || "unknown",
  });

  const cookieOptions = {
    httpOnly: true,
    secure: envConfig.NODE_ENV === "production",
    sameSite: envConfig.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 1,
  };

  const { password: _, ...userWithoutPassword } = userExists;

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, "Login Successful", {
        user: userWithoutPassword,
        accessToken,
      }),
    );
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token not found");
  }

  const hashedRefreshToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const decodedToken = jwt.verify(refreshToken, envConfig.JWT_SECRET);

  const [currentSession] = await db
    .select()
    .from(session)
    .where(
      and(
        eq(session.token, hashedRefreshToken),
        eq(session.id, decodedToken.sid),
        eq(session.revoked, false)
      )
    );

  if (!currentSession) {
    throw new ApiError(401, "Invalid token");
  }

  const accessToken = await getAccessToken(
    decodedToken.userId || decodedToken.id,
    decodedToken.email,
    decodedToken.role,
    currentSession.id,
  );

  const cookieOptions = {
    httpOnly: true,
    secure: envConfig.NODE_ENV === "production",
    sameSite: envConfig.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 1,
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, "Refresh token successful", {
        accessToken,
      }),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token not found");
  }

  const hashedRefreshToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const decodedToken = jwt.verify(refreshToken, envConfig.JWT_SECRET);

  const [currentSession] = await db
    .select()
    .from(session)
    .where(
      and(
        eq(session.token, hashedRefreshToken),
        eq(session.id, decodedToken.sid),
        eq(session.revoked, false)
      )
    );

  if (!currentSession) {
    throw new ApiError(401, "Invalid token");
  }

  await db
    .update(session)
    .set({ revoked: true })
    .where(eq(session.id, decodedToken.sid));

  const cookieOptions = {
    httpOnly: true,
    secure: envConfig.NODE_ENV === "production",
    sameSite: envConfig.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  };

  return res
    .status(200)
    .clearCookie("refreshToken", cookieOptions)
    .json(
      new ApiResponse(200, "Logout Successful", {}),
    );
});

export default {
  loginUser,
  refreshToken,
  logoutUser,
};
