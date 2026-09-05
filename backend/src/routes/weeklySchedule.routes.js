import express from "express";
import weeklyScheduleController from "../controllers/weeklySchedule.controller.js";
import { validateInput } from "../middlewares/validateInput.middleware.js";
import {
  addIndividualDaySchema,
  createScheduleSchema,
  idParamSchema,
  scheduleIdParamSchema,
} from "../models/weeklySchedule.schema.js";
import { verifyAuth } from "../middlewares/verifyAuth.middleware.js";
import { authorizeRole } from "../middlewares/authorizeRole.middleware.js";

const router = express.Router();



router
  .route("/create")
  .post(
    verifyAuth,
    authorizeRole("ADMIN", "HR_MANAGER"),
    validateInput(createScheduleSchema),
    weeklyScheduleController.createSchedule,
  )
  .get(weeklyScheduleController.getAllSchedules);

router
  .route("/day")
  .post(
    verifyAuth,
    authorizeRole("ADMIN", "HR_MANAGER"),
    validateInput(addIndividualDaySchema),
    weeklyScheduleController.addIndividualDay,
  );

router
  .route("/day/:id")
  .delete(
    verifyAuth,
    authorizeRole("ADMIN", "HR_MANAGER"),
    validateInput(idParamSchema),
    weeklyScheduleController.deleteDay
  );

router
  .route("/:id")
  .delete(
    verifyAuth,
    authorizeRole("ADMIN", "HR_MANAGER"),
    validateInput(idParamSchema),
    weeklyScheduleController.deleteSchedule,
  );

router
  .route("/weekly/:scheduleId")
  .get(
    verifyAuth,
    authorizeRole("ADMIN", "HR_MANAGER", "HR_PAYROLL", "PAYROLL_ADMIN", "EMPLOYEE"),
    validateInput(scheduleIdParamSchema),
    weeklyScheduleController.getWeeklySchedule,
  );

router
  .route("/employee/:id")
  .get(
    verifyAuth,
    authorizeRole("ADMIN", "HR_MANAGER", "HR_PAYROLL", "PAYROLL_ADMIN", "EMPLOYEE"),
    validateInput(idParamSchema),
    weeklyScheduleController.getEmployeeSchedule,
  );

router.get(
  "/all",
  verifyAuth,
  authorizeRole("ADMIN", "HR_MANAGER", "HR_PAYROLL", "PAYROLL_ADMIN", "EMPLOYEE"),
  weeklyScheduleController.getAllSchedules
);

export default router;
