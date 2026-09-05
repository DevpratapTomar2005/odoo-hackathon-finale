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

// GET all attendance records
router
  .route("/")
  .get(
    verifyAuth,
    authorizeRole("ADMIN", "HR_MANAGER", "HR_PAYROLL", "PAYROLL_ADMIN"),
    attendanceController.getAllAttendance,
  )
  .post(
    verifyAuth,
    authorizeRole("ADMIN", "HR_MANAGER", "HR_PAYROLL"),
    attendanceController.createAttendanceRecord,
  );

// Check in
router
  .route("/check-in/:employeeId")
  .post(
    verifyAuth,
    authorizeRole("EMPLOYEE", "ADMIN", "HR_MANAGER", "HR_PAYROLL", "PAYROLL_ADMIN"),
    validateInput(checkInSchema),
    attendanceController.checkIn,
  );

// Check out
router
  .route("/check-out/:attendanceId")
  .post(
    verifyAuth,
    authorizeRole("EMPLOYEE", "ADMIN", "HR_MANAGER", "HR_PAYROLL", "PAYROLL_ADMIN"),
    validateInput(checkOutSchema),
    attendanceController.checkOut,
  );

// Correct/update a specific attendance record
router
  .route("/:attendanceId")
  .patch(
    verifyAuth,
    authorizeRole("ADMIN", "HR_MANAGER", "HR_PAYROLL"),
    attendanceController.correctAttendance,
  );

// Get attendance by date
router
  .route("/date/:date")
  .get(
    verifyAuth,
    authorizeRole("ADMIN", "HR_MANAGER", "HR_PAYROLL", "PAYROLL_ADMIN"),
    validateInput(getAttendanceByDateSchema),
    attendanceController.getAllAttendenceByDate,
  );

// Get attendance by employee
router
  .route("/employee/:employeeId")
  .get(
    verifyAuth,
    authorizeRole("EMPLOYEE", "ADMIN", "HR_MANAGER", "HR_PAYROLL", "PAYROLL_ADMIN"),
    validateInput(getAttendanceByEmployeeSchema),
    attendanceController.getAllAttendenceByEmployee,
  );

export default router;
