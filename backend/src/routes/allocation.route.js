import express from "express";
import { validateInput } from "../middlewares/validateInput.middleware.js";
import {
  createAllocationSchema,
  editAllocationSchema,
  allocationIdParamSchema,
  employeeIdParamSchema,
} from "../models/allocation.schema.js";
import { verifyAuth } from "../middlewares/verifyAuth.middleware.js";
import { authorizeRole } from "../middlewares/authorizeRole.middleware.js";
import allocationController from "../controllers/allocation.controller.js";

const router = express.Router();

router.route("/:employeeId/create").post(
  verifyAuth,
  authorizeRole("ADMIN", "HR_MANAGER"),
  validateInput(createAllocationSchema),
  allocationController.createAllocation
);

router.route("/:employeeId/all").get(
  verifyAuth,
  authorizeRole("EMPLOYEE", "ADMIN", "HR_MANAGER", "HR_PAYROLL", "PAYROLL_ADMIN"),
  validateInput(employeeIdParamSchema),
  allocationController.getAllocationsByEmployee
);

router.route("/all").get(
  verifyAuth,
  authorizeRole("ADMIN", "HR_MANAGER"),
  allocationController.getAllAllocations
);

router.route("/:allocationId").put(
  verifyAuth,
  authorizeRole("ADMIN", "HR_MANAGER"),
  validateInput(editAllocationSchema),
  allocationController.editAllocation
);

router.route("/:allocationId/approve").patch(
  verifyAuth,
  authorizeRole("ADMIN", "HR_MANAGER"),
  validateInput(allocationIdParamSchema),
  allocationController.approveAllocation
);

router.route("/:allocationId/reject").patch(
  verifyAuth,
  authorizeRole("ADMIN", "HR_MANAGER"),
  validateInput(allocationIdParamSchema),
  allocationController.rejectAllocation
);

export default router;