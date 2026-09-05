import express from "express";
import salaryStructureController from "../controllers/salaryStructure.controller.js";
import { validateInput } from "../middlewares/validateInput.middleware.js";
import {
  createSalaryStructureSchema,
  editSalaryStructureSchema,
  salaryStructureIdParamSchema,
} from "../models/salarystructure.schema.js";
import { verifyAuth } from "../middlewares/verifyAuth.middleware.js";
import { authorizeRole } from "../middlewares/authorizeRole.middleware.js";

const router = express.Router();

router
  .route("/")
  .post(
    verifyAuth,
    authorizeRole("ADMIN", "PAYROLL_ADMIN"),
    validateInput(createSalaryStructureSchema),
    salaryStructureController.createSalaryStructure,
  )
  .get(
    verifyAuth,
    authorizeRole("ADMIN", "PAYROLL_ADMIN", "HR_PAYROLL"),
    salaryStructureController.getAllSalaryStructures,
  );

router
  .route("/:salaryStructureId")
  .get(
    verifyAuth,
    authorizeRole("ADMIN", "PAYROLL_ADMIN", "HR_PAYROLL"),
    validateInput(salaryStructureIdParamSchema),
    salaryStructureController.getSalaryStructureById,
  )
  .patch(
    verifyAuth,
    authorizeRole("ADMIN", "PAYROLL_ADMIN"),
    validateInput(editSalaryStructureSchema),
    salaryStructureController.editSalaryStructure,
  );

export default router;