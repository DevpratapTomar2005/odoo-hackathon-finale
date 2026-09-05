import express from "express";
import userController from "../controllers/user.controller.js";
import { validateInput } from "../middlewares/validateInput.middleware.js";
import { createUserSchema } from "../models/user.schema.js";
import { verifyAuth } from "../middlewares/verifyAuth.middleware.js";
import { authorizeRole } from "../middlewares/authorizeRole.middleware.js";
const router = express.Router();

router.post(
    "/create",
    verifyAuth,
    authorizeRole("ADMIN"),
    validateInput(createUserSchema),
    userController.createUser
    );

export default router;