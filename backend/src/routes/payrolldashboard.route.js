import express from "express";
import payrollDashboardController from "../controllers/payrollDashboard.controller.js";
import { validateInput } from "../middlewares/validateInput.middleware.js";
import { getPayrollDashboardSchema } from "../models/payrollDashboard.schema.js";
import { verifyAuth } from "../middlewares/verifyAuth.middleware.js";
import { authorizeRole } from "../middlewares/authorizeRole.middleware.js";

const router = express.Router();

router
  .route("/")
  .get(
    verifyAuth,
    authorizeRole("ADMIN", "PAYROLL_ADMIN", "HR_PAYROLL", "HR_MANAGER"),
    validateInput(getPayrollDashboardSchema),
    payrollDashboardController.getPayrollDashboard,
  );

export default router;