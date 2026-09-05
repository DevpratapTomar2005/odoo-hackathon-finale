import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { employee, contract, attendance, timeoff, allocation, user } from "../db/schema.js";
import { eq, count, desc } from "drizzle-orm";
import { db } from "../db/db.js";

const getMe = asyncHandler(async (req, res) => {
  const [employeeRecord] = await db
    .select()
    .from(employee)
    .where(eq(employee.userId, req.user.userId)); 

  if (!employeeRecord) {
    throw new ApiError(404, "Employee record not found for this user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Employee profile fetched successfully", employeeRecord));
});

const getEmployeeHubStats = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existingEmployee] = await db
    .select()
    .from(employee)
    .where(eq(employee.id, id));

  if (!existingEmployee) {
    throw new ApiError(404, "Employee not found");
  }

  const [contracts] = await db.select({ value: count() }).from(contract).where(eq(contract.employeeId, id));
  const [attendances] = await db.select({ value: count() }).from(attendance).where(eq(attendance.employeeId, id));
  const [timeoffs] = await db.select({ value: count() }).from(timeoff).where(eq(timeoff.employeeId, id));
  const [allocations] = await db.select({ value: count() }).from(allocation).where(eq(allocation.employeeId, id));

  return res.status(200).json(
    new ApiResponse(200, "Employee hub stats fetched successfully", {
      contracts: contracts.value,
      attendance: attendances.value,
      timeOff: timeoffs.value,
      allocations: allocations.value,
    })
  );
});

const getAllEmployees = asyncHandler(async (req, res) => {
  const employees = await db
    .select({
      id: employee.id,
      employeeId: employee.employeeId,
      department: employee.department,
      designation: employee.designation,
      status: employee.status,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    })
    .from(employee)
    .leftJoin(user, eq(employee.userId, user.id))
    .orderBy(desc(employee.createdAt));

  return res.status(200).json(new ApiResponse(200, "Employees fetched successfully", employees));
});

const getEmployeeById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [employeeRecord] = await db
    .select()
    .from(employee)
    .where(eq(employee.id, id));

  if (!employeeRecord) {
    throw new ApiError(404, "Employee not found");
  }

  return res.status(200).json(new ApiResponse(200, "Employee fetched successfully", employeeRecord));
});

const updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { department, designation, managerId, status, workingWeeklyScheduleId } = req.body;

  const [existingEmployee] = await db
    .select()
    .from(employee)
    .where(eq(employee.id, id));

  if (!existingEmployee) {
    throw new ApiError(404, "Employee not found");
  }

  const updateObj = {};
  if (department !== undefined) updateObj.department = department;
  if (designation !== undefined) updateObj.designation = designation;
  if (managerId !== undefined) updateObj.managerId = managerId;
  if (status !== undefined) updateObj.status = status;
  if (workingWeeklyScheduleId !== undefined) updateObj.workingWeeklyScheduleId = workingWeeklyScheduleId;
  updateObj.updatedAt = new Date();

  const [updatedEmployee] = await db
    .update(employee)
    .set(updateObj)
    .where(eq(employee.id, id))
    .returning();

  return res.status(200).json(new ApiResponse(200, "Employee updated successfully", updatedEmployee));
});

export default {
  getMe,
  getEmployeeHubStats,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
};