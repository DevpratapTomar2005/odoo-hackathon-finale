import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { employee, attendance } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { db } from "../db/db.js";

//TODO: Automatically mark absent if attendence is not marked by someone by the end of the day. And fetch day schedule from weekly schedule for calculating overtime (frontend).

const checkIn = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;

  const [existingEmployee] = await db
    .select()
    .from(employee)
    .where(eq(employee.id, employeeId));

  if (!existingEmployee) {
    throw new ApiError(404, "Employee does not exist");
  }

  const [newAttendance] = await db
    .insert(attendance)
    .values({
      employeeId: existingEmployee.id,
      date: new Date(),
      checkIn: new Date(),
      status: "PRESENT",
    })
    .returning();

  if (!newAttendance) {
    throw new ApiError(400, "Failed to check in");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, "Checked in successfully", newAttendance));
});

const checkOut = asyncHandler(async (req, res) => {
  const { attendanceId } = req.params;
  const { overtimeHours } = req.body;

  const [existingAttendance] = await db
    .select()
    .from(attendance)
    .where(eq(attendance.id, attendanceId));

  if (!existingAttendance) {
    throw new ApiError(404, "Attendance does not exist");
  }

  const workedHours = Math.round(
    (new Date().getTime() - new Date(existingAttendance.checkIn).getTime()) /
      (1000 * 60 * 60),
  );
  const [updatedAttendance] = await db
    .update(attendance)
    .set({
      checkOut: new Date(),
      workedHours: workedHours,
      overtimeHours: overtimeHours ?? 0,
    })
    .where(eq(attendance.id, attendanceId))
    .returning();

  if (!updatedAttendance) {
    throw new ApiError(400, "Failed to check out");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Checked out successfully", updatedAttendance));
});

const getAllAttendenceByDate = asyncHandler(async (req, res) => {
  const { date } = req.params;

  const allAttendance = await db
    .select()
    .from(attendance)
    .where(eq(attendance.date, date));

  if (allAttendance.length === 0) {
    throw new ApiError(404, "No attendance found for this date");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Attendance fetched successfully", allAttendance),
    );
});

const getAllAttendenceByEmployee = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;

  const allAttendance = await db
    .select()
    .from(attendance)
    .where(eq(attendance.employeeId, employeeId));

  if (allAttendance.length === 0) {
    throw new ApiError(404, "No attendance found for this employee");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Attendance fetched successfully", allAttendance),
    );
});

export default {
  checkIn,
  checkOut,
  getAllAttendenceByDate,
  getAllAttendenceByEmployee,
};
