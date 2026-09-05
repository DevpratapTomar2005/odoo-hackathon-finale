import express from "express";
import salaryRuleController from "../controllers/salaryRule.controller.js";
import { validateInput } from "../middlewares/validateInput.middleware.js";
import {
  createSalaryRuleSchema,
  editSalaryRuleSchema,
  salaryStructureIdParamSchema,
  salaryRuleIdParamSchema,
} from "../models/salaryRule.schema.js";
import { verifyAuth } from "../middlewares/verifyAuth.middleware.js";
import { authorizeRole } from "../middlewares/authorizeRole.middleware.js";

const router = express.Router();

router
  .route("/structure/:salaryStructureId")
  .post(
    verifyAuth,
    authorizeRole("ADMIN", "PAYROLL_ADMIN"),
    validateInput(createSalaryRuleSchema),
    salaryRuleController.createSalaryRule,
  )
  .get(
    verifyAuth,
    authorizeRole("ADMIN", "PAYROLL_ADMIN", "HR_PAYROLL"),
    validateInput(salaryStructureIdParamSchema),
    salaryRuleController.getSalaryRulesByStructure,
  );

router
  .route("/:salaryRuleId")
  .get(
    verifyAuth,
    authorizeRole("ADMIN", "PAYROLL_ADMIN", "HR_PAYROLL"),
    validateInput(salaryRuleIdParamSchema),
    salaryRuleController.getSalaryRuleById,
  )
  .patch(
    verifyAuth,
    authorizeRole("ADMIN", "PAYROLL_ADMIN"),
    validateInput(editSalaryRuleSchema),
    salaryRuleController.editSalaryRule,
  );

export default router;