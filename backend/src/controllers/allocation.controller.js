import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { allocation, employee, timeoffType } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { db } from "../db/db.js";

const createAllocation = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const { timeoffTypeId, allocatedDays, validityYear } = req.body;

  const [existingEmployee] = await db
    .select()
    .from(employee)
    .where(eq(employee.id, employeeId));

  if (!existingEmployee) {
    throw new ApiError(404, "Employee does not exist");
  }

  const [existingTimeOffType] = await db
    .select()
    .from(timeoffType)
    .where(eq(timeoffType.id, timeoffTypeId));

  if (!existingTimeOffType) {
    throw new ApiError(404, "Time off type does not exist");
  }

  const [duplicateAllocation] = await db
    .select()
    .from(allocation)
    .where(
      and(
        eq(allocation.employeeId, employeeId),
        eq(allocation.timeoffTypeId, timeoffTypeId),
        eq(allocation.validityYear, validityYear),
      ),
    );

  if (duplicateAllocation && duplicateAllocation.status !== "REJECTED") {
    throw new ApiError(
      400,
      "An allocation already exists for this employee, type and year",
    );
  }

  const [newAllocation] = await db
    .insert(allocation)
    .values({
      employeeId: existingEmployee.id,
      timeoffTypeId: existingTimeOffType.id,
      allocatedDays,
      takenDays: 0,
      remainingDays: allocatedDays,
      validityYear,
    })
    .returning();

  if (!newAllocation) {
    throw new ApiError(400, "Failed to create allocation");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, "Allocation created successfully", newAllocation));
});

const editAllocation = asyncHandler(async (req, res) => {
  const { allocationId } = req.params;
  const { allocatedDays, takenDays, remainingDays, validityYear } = req.body;

  const [existingAllocation] = await db
    .select()
    .from(allocation)
    .where(eq(allocation.id, allocationId));

  if (!existingAllocation) {
    throw new ApiError(404, "Allocation not found");
  }

  if (existingAllocation.status !== "PENDING") {
    throw new ApiError(400, "Cannot edit an already processed allocation");
  }

  const updateObj = {};

  if (allocatedDays !== undefined) {
    updateObj.allocatedDays = allocatedDays;
  }

  if (takenDays !== undefined) {
    updateObj.takenDays = takenDays;
  }

  if (remainingDays !== undefined) {
    updateObj.remainingDays = remainingDays;
  }

  if (validityYear !== undefined) {
    updateObj.validityYear = validityYear;
  }

  const [updatedAllocation] = await db
    .update(allocation)
    .set(updateObj)
    .where(eq(allocation.id, allocationId))
    .returning();

  if (!updatedAllocation) {
    throw new ApiError(400, "Failed to edit allocation");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Allocation edited successfully", updatedAllocation),
    );
});

const approveAllocation = asyncHandler(async (req, res) => {
  const { allocationId } = req.params;

  const [existingAllocation] = await db
    .select()
    .from(allocation)
    .where(eq(allocation.id, allocationId));

  if (!existingAllocation) {
    throw new ApiError(404, "Allocation not found");
  }

  if (existingAllocation.status !== "PENDING") {
    throw new ApiError(400, "Allocation is already processed");
  }

  const [approvedAllocation] = await db
    .update(allocation)
    .set({
      status: "APPROVED",
      approver: req.user.id,
    })
    .where(eq(allocation.id, allocationId))
    .returning();

  if (!approvedAllocation) {
    throw new ApiError(400, "Failed to approve allocation");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Allocation approved successfully",
        approvedAllocation,
      ),
    );
});

const rejectAllocation = asyncHandler(async (req, res) => {
  const { allocationId } = req.params;

  const [existingAllocation] = await db
    .select()
    .from(allocation)
    .where(eq(allocation.id, allocationId));

  if (!existingAllocation) {
    throw new ApiError(404, "Allocation not found");
  }

  if (existingAllocation.status !== "PENDING") {
    throw new ApiError(400, "Allocation is already processed");
  }

  const [rejectedAllocation] = await db
    .update(allocation)
    .set({
      status: "REJECTED",
      approver: req.user.id,
    })
    .where(eq(allocation.id, allocationId))
    .returning();

  if (!rejectedAllocation) {
    throw new ApiError(400, "Failed to reject allocation");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Allocation rejected successfully",
        rejectedAllocation,
      ),
    );
});

const getAllAllocations = asyncHandler(async (req, res) => {
  const allAllocations = await db.select().from(allocation);

  if (allAllocations.length === 0) {
    throw new ApiError(404, "No allocations found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Allocations fetched successfully", allAllocations),
    );
});

const getAllocationsByEmployee = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;

  const allocations = await db
    .select()
    .from(allocation)
    .where(eq(allocation.employeeId, employeeId));

  if (allocations.length === 0) {
    throw new ApiError(404, "No allocations found for this employee");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Allocations fetched successfully", allocations),
    );
});

export default {
  createAllocation,
  editAllocation,
  approveAllocation,
  rejectAllocation,
  getAllAllocations,
  getAllocationsByEmployee,
};
