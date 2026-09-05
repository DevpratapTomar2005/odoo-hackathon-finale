import express from "express";
import attendanceController from "../controllers/attendence.controller.js";
import { validateInput } from "../middlewares/validateInput.middleware.js";
import {
  checkInSchema,
  checkOutSchema,
  getAttendanceByDateSchema,
  getAttendanceByEmployeeSchema,
} from "../models/attendence.schema.js";
import { verifyAuth } from "../middlewares/verifyAuth.middleware.js";
import { authorizeRole } from "../middlewares/authorizeRole.middleware.js";

const router = express.Router();

router
  .route("/check-in/:employeeId")
  .post(
    verifyAuth,
    authorizeRole("ADMIN"),
    validateInput(checkInSchema),
    attendanceController.checkIn,
  );

router
  .route("/check-out/:attendanceId")
  .post(
    verifyAuth,
    authorizeRole("ADMIN"),
    validateInput(checkOutSchema),
    attendanceController.checkOut,
  );

router
  .route("/date/:date")
  .get(
    verifyAuth,
    authorizeRole("ADMIN"),
    validateInput(getAttendanceByDateSchema),
    attendanceController.getAllAttendenceByDate,
  );

router
  .route("/employee/:employeeId")
  .get(
    verifyAuth,
    authorizeRole("ADMIN"),
    validateInput(getAttendanceByEmployeeSchema),
    attendanceController.getAllAttendenceByEmployee,
  );

export default router;
