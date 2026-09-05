import express from "express";
import { validateInput } from "../middlewares/validateInput.middleware.js";
import { createContractSchema, updateContractSchema, idParamSchema } from "../models/contract.schema.js";
import { verifyAuth } from "../middlewares/verifyAuth.middleware.js";
import { authorizeRole } from "../middlewares/authorizeRole.middleware.js";
import contractController from "../controllers/contract.controller.js";
const router = express.Router();

router.route("/create").post(
    verifyAuth,
    authorizeRole("ADMIN", "HR_MANAGER", "PAYROLL_ADMIN"),
    validateInput(createContractSchema),
    contractController.createContract
);

router.route("/all").get(
    verifyAuth,
    authorizeRole("ADMIN", "HR_MANAGER", "HR_PAYROLL", "PAYROLL_ADMIN"),
    contractController.getAllContracts
);

router.route("/:id").get(
    verifyAuth,
    authorizeRole("ADMIN", "HR_MANAGER", "HR_PAYROLL", "PAYROLL_ADMIN"),
    validateInput(idParamSchema),
    contractController.getContractById
);

router.route("/:id").put(
    verifyAuth,
    authorizeRole("ADMIN", "HR_MANAGER", "PAYROLL_ADMIN"),
    validateInput(updateContractSchema),
    contractController.updateContract
);



export default router;