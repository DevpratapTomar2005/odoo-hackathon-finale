import express from "express";
import payrunController from "../controllers/payrun.controller.js";
import { validateInput } from "../middlewares/validateInput.middleware.js";
import {
  createPayrunSchema,
  payrunIdParamSchema,
} from "../models/payrun.schema.js";
import { verifyAuth } from "../middlewares/verifyAuth.middleware.js";
import { authorizeRole } from "../middlewares/authorizeRole.middleware.js";

const router = express.Router();

router
  .route("/")
  .post(
    verifyAuth,
    authorizeRole("ADMIN", "PAYROLL_ADMIN", "HR_PAYROLL"),
    validateInput(createPayrunSchema),
    payrunController.createPayrun,
  )
  .get(
    verifyAuth,
    authorizeRole("ADMIN", "PAYROLL_ADMIN", "HR_PAYROLL"),
    payrunController.getAllPayruns,
  );

router
  .route("/:payrunId")
  .get(
    verifyAuth,
    authorizeRole("ADMIN", "PAYROLL_ADMIN", "HR_PAYROLL"),
    validateInput(payrunIdParamSchema),
    payrunController.getPayrunById,
  );

router
  .route("/:payrunId/compute")
  .post(
    verifyAuth,
    authorizeRole("ADMIN", "PAYROLL_ADMIN", "HR_PAYROLL"),
    validateInput(payrunIdParamSchema),
    payrunController.computePayrun,
  );

router
  .route("/:payrunId/validate")
  .post(
    verifyAuth,
    authorizeRole("ADMIN", "PAYROLL_ADMIN", "HR_PAYROLL"),
    validateInput(payrunIdParamSchema),
    payrunController.validatePayrun,
  );

router
  .route("/:payrunId/mark-paid")
  .post(
    verifyAuth,
    authorizeRole("ADMIN", "PAYROLL_ADMIN", "HR_PAYROLL"),
    validateInput(payrunIdParamSchema),
    payrunController.markPayrunPaid,
  );

router
  .route("/:payrunId/send-payslips")
  .post(
    verifyAuth,
    authorizeRole("ADMIN", "PAYROLL_ADMIN", "HR_PAYROLL"),
    validateInput(payrunIdParamSchema),
    payrunController.sendPayslips,
  );

export default router;