import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { employee, attendance } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
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

const getAllAttendance = asyncHandler(async (req, res) => {
  const allAttendance = await db.select().from(attendance).orderBy(desc(attendance.date), desc(attendance.createdAt));
  return res
    .status(200)
    .json(new ApiResponse(200, "Attendance fetched successfully", allAttendance));
});

const getAllAttendenceByDate = asyncHandler(async (req, res) => {
  const { date } = req.params;

  const allAttendance = await db
    .select()
    .from(attendance)
    .where(eq(attendance.date, date))
    .orderBy(desc(attendance.createdAt));

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
    .where(eq(attendance.employeeId, employeeId))
    .orderBy(desc(attendance.date));

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Attendance fetched successfully", allAttendance),
    );
});

const correctAttendance = asyncHandler(async (req, res) => {
  const { attendanceId } = req.params;
  const { workedHours, overtimeHours, status, date } = req.body;

  const [existingAttendance] = await db
    .select()
    .from(attendance)
    .where(eq(attendance.id, attendanceId));

  if (!existingAttendance) {
    throw new ApiError(404, "Attendance record does not exist");
  }

  const updateObj = {};
  if (workedHours !== undefined) updateObj.workedHours = Number(workedHours);
  if (overtimeHours !== undefined) updateObj.overtimeHours = Number(overtimeHours);
  if (status) updateObj.status = status;
  if (date) updateObj.date = new Date(date);

  const [updated] = await db
    .update(attendance)
    .set(updateObj)
    .where(eq(attendance.id, attendanceId))
    .returning();

  if (!updated) {
    throw new ApiError(400, "Failed to correct attendance");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Attendance corrected successfully", updated));
});

const createAttendanceRecord = asyncHandler(async (req, res) => {
  const { employeeId, date, workedHours, overtimeHours, status } = req.body;

  const [existingEmployee] = await db
    .select()
    .from(employee)
    .where(eq(employee.id, employeeId));

  if (!existingEmployee) {
    throw new ApiError(404, "Employee does not exist");
  }

  const [newRecord] = await db
    .insert(attendance)
    .values({
      employeeId: existingEmployee.id,
      date: date ? new Date(date) : new Date(),
      workedHours: workedHours ? Number(workedHours) : 0,
      overtimeHours: overtimeHours ? Number(overtimeHours) : 0,
      status: status || "PRESENT",
    })
    .returning();

  if (!newRecord) {
    throw new ApiError(400, "Failed to create attendance record");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, "Attendance record created", newRecord));
});

export default {
  checkIn,
  checkOut,
  getAllAttendance,
  getAllAttendenceByDate,
  getAllAttendenceByEmployee,
  correctAttendance,
  createAttendanceRecord,
};
