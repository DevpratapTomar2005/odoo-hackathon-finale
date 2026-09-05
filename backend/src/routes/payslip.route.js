import express from "express";
import payslipController from "../controllers/payslip.controller.js";
import { validateInput } from "../middlewares/validateInput.middleware.js";
import {
  employeeIdParamSchema,
  payslipIdParamSchema,
} from "../models/payslip.schema.js";
import { verifyAuth } from "../middlewares/verifyAuth.middleware.js";
import { authorizeRole } from "../middlewares/authorizeRole.middleware.js";

const router = express.Router();

router
  .route("/")
  .get(
    verifyAuth,
    authorizeRole("ADMIN", "PAYROLL_ADMIN", "HR_PAYROLL"),
    payslipController.getAllPayslips,
  );

router
  .route("/employee/:employeeId")
  .get(
    verifyAuth,
    authorizeRole("ADMIN", "PAYROLL_ADMIN", "HR_PAYROLL", "EMPLOYEE"),
    validateInput(employeeIdParamSchema),
    payslipController.getPayslipsByEmployee,
  );

router
  .route("/:payslipId")
  .get(
    verifyAuth,
    authorizeRole("ADMIN", "PAYROLL_ADMIN", "HR_PAYROLL", "EMPLOYEE"),
    validateInput(payslipIdParamSchema),
    payslipController.getPayslipById,
  );

router
  .route("/:payslipId/print")
  .get(
    verifyAuth,
    authorizeRole("ADMIN", "PAYROLL_ADMIN", "HR_PAYROLL", "EMPLOYEE"),
    validateInput(payslipIdParamSchema),
    payslipController.printPayslip,
  );

export default router;