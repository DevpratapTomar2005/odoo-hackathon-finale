import express from "express";
import { validateInput } from "../middlewares/validateInput.middleware.js";
import {
  createTimeOffTypeSchema,
  editTimeOffTypeSchema,
  createTimeOffRequestSchema,
  timeoffIdParamSchema,
  employeeIdParamSchema,
} from "../models/timeoff.schema.js";
import { verifyAuth } from "../middlewares/verifyAuth.middleware.js";
import { authorizeRole } from "../middlewares/authorizeRole.middleware.js";
import timeoffController from "../controllers/timeoff.controller.js";

const router = express.Router();

router.route("/types").post(
  verifyAuth,
  authorizeRole("HR_MANAGER","ADMIN"),
  validateInput(createTimeOffTypeSchema),
  timeoffController.createTimeOffType
);

router.route("/types/:timeoffTypeId").put(
  verifyAuth,
  authorizeRole("HR_MANAGER","ADMIN"),
  validateInput(editTimeOffTypeSchema),
  timeoffController.editTimeOffType
);

router.route("/:employeeId/create").post(
  verifyAuth,
  validateInput(createTimeOffRequestSchema),
  timeoffController.createTimeOffRequest
);

router.route("/:employeeId/request").get(
  verifyAuth,
  validateInput(employeeIdParamSchema),
  timeoffController.getTimeOffRequestsByEmployee
);

router.route("/all").get(
  verifyAuth,
  authorizeRole("HR_MANAGER","ADMIN"),
  timeoffController.getAllTimeOffRequests
);

router.route("/:timeoffId/approve").patch(
  verifyAuth,
  authorizeRole("HR_MANAGER","ADMIN"),
  validateInput(timeoffIdParamSchema),
  timeoffController.approveTimeOffRequest
);

router.route("/:timeoffId/reject").patch(
  verifyAuth,
  authorizeRole("HR_MANAGER","ADMIN"),
  validateInput(timeoffIdParamSchema),
  timeoffController.rejectTimeOffRequest
);

export default router;