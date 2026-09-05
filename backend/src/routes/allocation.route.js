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
  authorizeRole("HR_MANAGER","ADMIN"),
  validateInput(createAllocationSchema),
  allocationController.createAllocation
);

router.route("/:employeeId/all").get(
  verifyAuth,
  validateInput(employeeIdParamSchema),
  allocationController.getAllocationsByEmployee
);

router.route("/all").get(
  verifyAuth,
  authorizeRole("HR_MANAGER","ADMIN"),
  allocationController.getAllAllocations
);

router.route("/:allocationId").put(
  verifyAuth,
  authorizeRole("HR_MANAGER","ADMIN"),
  validateInput(editAllocationSchema),
  allocationController.editAllocation
);

router.route("/:allocationId/approve").patch(
  verifyAuth,
  authorizeRole("HR_MANAGER","ADMIN"),
  validateInput(allocationIdParamSchema),
  allocationController.approveAllocation
);

router.route("/:allocationId/reject").patch(
  verifyAuth,
  authorizeRole("HR_MANAGER","ADMIN"),
  validateInput(allocationIdParamSchema),
  allocationController.rejectAllocation
);

export default router;