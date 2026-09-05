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

router
  .route("/types")
  .get(
    verifyAuth,
    authorizeRole("ADMIN", "HR_MANAGER", "EMPLOYEE", "HR_PAYROLL", "PAYROLL_ADMIN"),
    timeoffController.getAllTimeOffTypes,
  )
  .post(
    verifyAuth,
    authorizeRole("ADMIN", "HR_MANAGER"),
    validateInput(createTimeOffTypeSchema),
    timeoffController.createTimeOffType,
  );

router
  .route("/types/:timeoffTypeId")
  .put(
    verifyAuth,
    authorizeRole("ADMIN", "HR_MANAGER"),
    validateInput(editTimeOffTypeSchema),
    timeoffController.editTimeOffType,
  );

router
  .route("/:employeeId/create")
  .post(
    verifyAuth,
    authorizeRole("EMPLOYEE", "ADMIN", "HR_MANAGER", "HR_PAYROLL", "PAYROLL_ADMIN"),
    validateInput(createTimeOffRequestSchema),
    timeoffController.createTimeOffRequest,
  );

router
  .route("/:employeeId/request")
  .get(
    verifyAuth,
    authorizeRole("EMPLOYEE", "ADMIN", "HR_MANAGER", "HR_PAYROLL", "PAYROLL_ADMIN"),
    validateInput(employeeIdParamSchema),
    timeoffController.getTimeOffRequestsByEmployee,
  );

router
  .route("/all")
  .get(
    verifyAuth,
    authorizeRole("ADMIN", "HR_MANAGER"),
    timeoffController.getAllTimeOffRequests,
  );

router
  .route("/:timeoffId/approve")
  .patch(
    verifyAuth,
    authorizeRole("ADMIN", "HR_MANAGER"),
    validateInput(timeoffIdParamSchema),
    timeoffController.approveTimeOffRequest,
  );

router
  .route("/:timeoffId/reject")
  .patch(
    verifyAuth,
    authorizeRole("ADMIN", "HR_MANAGER"),
    validateInput(timeoffIdParamSchema),
    timeoffController.rejectTimeOffRequest,
  );

export default router;
