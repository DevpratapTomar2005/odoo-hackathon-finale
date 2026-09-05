import express from "express";
import authController from "../controllers/auth.controller.js";
import { loginUserSchema } from "../models/auth.schema.js";
import { validateInput } from "../middlewares/validateInput.middleware.js";
const router = express.Router();

router.post("/login",validateInput(loginUserSchema),authController.loginUser);
router.post("/refresh-token",authController.refreshToken);
router.post("/logout",authController.logoutUser);

export default router;