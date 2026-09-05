import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { timeoffType, timeoff, employee, allocation } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { db } from "../db/db.js";

const createTimeOffType = asyncHandler(async (req, res) => {
  const { name, unit, allocationNeed, displayColour, status } = req.body;

  const [newTimeOffType] = await db
    .insert(timeoffType)
    .values({
      name,
      unit,
      allocationNeed,
      displayColour,
      status,
    })
    .returning();

  if (!newTimeOffType) {
    throw new ApiError(400, "Failed to create time off type");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        "Time off type created successfully",
        newTimeOffType,
      ),
    );
});

const editTimeOffType = asyncHandler(async (req, res) => {
  const { timeoffTypeId } = req.params;
  const { name, unit, allocationNeed, displayColour, status } = req.body;

  const existingTimeOffType = await db
    .select()
    .from(timeoffType)
    .where(eq(timeoffType.id, timeoffTypeId));

  if (existingTimeOffType.length === 0) {
    throw new ApiError(404, "Time off type not found");
  }

  const updateObj = {};

  if (name) {
    updateObj.name = name;
  }

  if (unit) {
    updateObj.unit = unit;
  }

  if (allocationNeed) {
    updateObj.allocationNeed = allocationNeed;
  }

  if (displayColour) {
    updateObj.displayColour = displayColour;
  }

  if (status) {
    updateObj.status = status;
  }

  const [updatedTimeOffType] = await db
    .update(timeoffType)
    .set(updateObj)
    .where(eq(timeoffType.id, timeoffTypeId))
    .returning();

  if (!updatedTimeOffType) {
    throw new ApiError(400, "Failed to edit time off type");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Time off type edited successfully",
        updatedTimeOffType,
      ),
    );
});

const createTimeOffRequest = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const { startDate, endDate, timeoffType: timeoffTypeId, reason } = req.body;

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

  const [newTimeOffRequest] = await db
    .insert(timeoff)
    .values({
      employeeId: existingEmployee.id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      timeoffType: existingTimeOffType.id,
      reason,
    })
    .returning();

  if (!newTimeOffRequest) {
    throw new ApiError(400, "Failed to create time off request");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        "Time off request created successfully",
        newTimeOffRequest,
      ),
    );
});

const approveTimeOffRequest = asyncHandler(async (req, res) => {
  const { timeoffId } = req.params;

  const [existingTimeOff] = await db
    .select()
    .from(timeoff)
    .where(eq(timeoff.id, timeoffId));

  if (!existingTimeOff) {
    throw new ApiError(404, "Time off request does not exist");
  }

  if (existingTimeOff.status !== "PENDING") {
    throw new ApiError(400, "Time off request is already processed");
  }

  const [existingTimeOffType] = await db
    .select()
    .from(timeoffType)
    .where(eq(timeoffType.id, existingTimeOff.timeoffType));

  if (!existingTimeOffType) {
    throw new ApiError(404, "Time off type does not exist");
  }

  const approvedTimeOff = await db.transaction(async (tx) => {
    if (existingTimeOffType.allocationNeed === "REQUIRED") {
      const requestYear = new Date(existingTimeOff.startDate).getFullYear();

      const [existingAllocation] = await tx
        .select()
        .from(allocation)
        .where(
          and(
            eq(allocation.employeeId, existingTimeOff.employeeId),
            eq(allocation.timeoffTypeId, existingTimeOffType.id),
            eq(allocation.validityYear, requestYear),
            eq(allocation.status, "APPROVED"),
          ),
        );

      if (!existingAllocation) {
        throw new ApiError(
          404,
          "No approved allocation found for this employee for the request year",
        );
      }

      const requestedDays = Math.ceil(
        (new Date(existingTimeOff.endDate).getTime() -
          new Date(existingTimeOff.startDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (existingAllocation.remainingDays < requestedDays) {
        throw new ApiError(400, "Insufficient leave balance");
      }

      await tx
        .update(allocation)
        .set({
          takenDays: existingAllocation.takenDays + requestedDays,
          remainingDays: existingAllocation.remainingDays - requestedDays,
        })
        .where(eq(allocation.id, existingAllocation.id));
    }

    const [updatedTimeOff] = await tx
      .update(timeoff)
      .set({
        status: "APPROVED",
        approver: req.user.userId,
      })
      .where(eq(timeoff.id, timeoffId))
      .returning();

    return updatedTimeOff;
  });

  if (!approvedTimeOff) {
    throw new ApiError(400, "Failed to approve time off request");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Time off request approved successfully",
        approvedTimeOff,
      ),
    );
});

const rejectTimeOffRequest = asyncHandler(async (req, res) => {
  const { timeoffId } = req.params;

  const [existingTimeOff] = await db
    .select()
    .from(timeoff)
    .where(eq(timeoff.id, timeoffId));

  if (!existingTimeOff) {
    throw new ApiError(404, "Time off request does not exist");
  }

  if (existingTimeOff.status !== "PENDING") {
    throw new ApiError(400, "Time off request is already processed");
  }

  const [rejectedTimeOff] = await db
    .update(timeoff)
    .set({
      status: "REJECTED",
      approver: req.user.id,
    })
    .where(eq(timeoff.id, timeoffId))
    .returning();

  if (!rejectedTimeOff) {
    throw new ApiError(400, "Failed to reject time off request");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Time off request rejected successfully",
        rejectedTimeOff,
      ),
    );
});

const getAllTimeOffRequests = asyncHandler(async (req, res) => {
  const allTimeOffRequests = await db.select().from(timeoff);

  if (allTimeOffRequests.length === 0) {
    throw new ApiError(404, "No time off requests found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Time off requests fetched successfully",
        allTimeOffRequests,
      ),
    );
});

const getTimeOffRequestsByEmployee = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;

  const timeOffRequests = await db
    .select()
    .from(timeoff)
    .where(eq(timeoff.employeeId, employeeId));

  if (timeOffRequests.length === 0) {
    throw new ApiError(404, "No time off requests found for this employee");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Time off requests fetched successfully",
        timeOffRequests,
      ),
    );
});

export default {
  createTimeOffType,
  editTimeOffType,
  createTimeOffRequest,
  approveTimeOffRequest,
  rejectTimeOffRequest,
  getAllTimeOffRequests,
  getTimeOffRequestsByEmployee,
};
