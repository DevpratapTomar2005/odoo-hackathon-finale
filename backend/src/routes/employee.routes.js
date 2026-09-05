import express from "express";
import employeeController from "../controllers/employee.controller.js";
import { verifyAuth } from "../middlewares/verifyAuth.middleware.js";
import { authorizeRole } from "../middlewares/authorizeRole.middleware.js";
import { validateInput } from "../middlewares/validateInput.middleware.js";
import { getEmployeeByIdSchema, updateEmployeeSchema } from "../models/employee.schema.js";

const router = express.Router();


router
  .route("/me")
  .get(
    verifyAuth,
    authorizeRole("ADMIN", "EMPLOYEE", "HR_MANAGER", "HR_PAYROLL", "PAYROLL_ADMIN"),
    employeeController.getMe,
  );


router
  .route("/")
  .get(
    verifyAuth,
    authorizeRole("HR_MANAGER", "ADMIN", "HR_PAYROLL", "PAYROLL_ADMIN"),
    employeeController.getAllEmployees,
  );

router
  .route("/:id")
  .get(
    verifyAuth,
    authorizeRole("HR_MANAGER", "ADMIN", "HR_PAYROLL", "PAYROLL_ADMIN"),
    validateInput(getEmployeeByIdSchema),
    employeeController.getEmployeeById,
  )
  .patch(
    verifyAuth,
    authorizeRole("HR_MANAGER", "ADMIN", "HR_PAYROLL", "PAYROLL_ADMIN"),
    validateInput(updateEmployeeSchema),
    employeeController.updateEmployee,
  );

router
  .route("/:id/hub-stats")
  .get(
    verifyAuth,
    authorizeRole("HR_MANAGER", "ADMIN", "HR_PAYROLL", "PAYROLL_ADMIN"),
    validateInput(getEmployeeByIdSchema),
    employeeController.getEmployeeHubStats,
  );

export default router;