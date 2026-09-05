import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  user,
  employee,
  workingWeeklySchedule,
  workingDaySchedule,
} from "../db/schema.js";
import { and, eq } from "drizzle-orm";
import { db } from "../db/db.js";

const createSchedule = asyncHandler(async (req, res) => {
  const {
    name,
    workingDays,
    workingHours,
    dailySchedule,
    startTime,
    endTime,
    breakMinutes,
    dayHours,
  } = req.body;

  const responseData = await db.transaction(async (tx) => {
    const [newSchedule] = await tx
      .insert(workingWeeklySchedule)
      .values({
        name,
        workingDays,
        workingHours,
        totalWorkingHours: workingHours * workingDays,
      })
      .returning({
        id: workingWeeklySchedule.id,
        name: workingWeeklySchedule.name,
        workingDays: workingWeeklySchedule.workingDays,
        workingHours: workingWeeklySchedule.workingHours,
        totalWorkingHours: workingWeeklySchedule.totalWorkingHours,
      });

    if (!newSchedule) {
      throw new ApiError(400, "Failed to create weekly schedule");
    }

    const dailyScheduleRecords = dailySchedule.map((scheduleItem) => ({
      workingWeeklyScheduleId: newSchedule.id,
      day: scheduleItem.day,
      startTime: scheduleItem.startTime || startTime,
      endTime: scheduleItem.endTime || endTime,
      breakMinutes: scheduleItem.breakMinutes || breakMinutes,
      dayHours: scheduleItem.dayHours || dayHours,
    }));

    const insertedDays = await tx
      .insert(workingDaySchedule)
      .values(dailyScheduleRecords)
      .returning();

    return {
      schedule: newSchedule,
      dailySchedule: insertedDays,
    };
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Schedule Created Successfully", responseData));
});

const addIndividualDay = asyncHandler(async (req, res) => {
  const {
    workingWeeklyScheduleId,
    day,
    startTime,
    endTime,
    breakMinutes,
    dayHours,
  } = req.body;

  const [isSchedule] = await db
    .select()
    .from(workingWeeklySchedule)
    .where(eq(workingWeeklySchedule.id, workingWeeklyScheduleId));

  if (!isSchedule) {
    throw new ApiError(404, "Weekly schedule not found");
  }

  const [newDay] = await db
    .insert(workingDaySchedule)
    .values({
      workingWeeklyScheduleId,
      day,
      startTime,
      endTime,
      breakMinutes,
      dayHours,
    })
    .returning();

  return res
    .status(201)
    .json(new ApiResponse(201, "Day Added Successfully", { day: newDay }));
});

const deleteDay = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [isDay] = await db
    .select()
    .from(workingDaySchedule)
    .where(eq(workingDaySchedule.id, id));
  if (!isDay) {
    throw new ApiError(404, "Day not found");
  }

  await db.delete(workingDaySchedule).where(eq(workingDaySchedule.id, id));

  return res
    .status(200)
    .json(new ApiResponse(200, "Day Deleted Successfully", {}));
});

const deleteSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [isSchedule] = await db
    .select()
    .from(workingWeeklySchedule)
    .where(eq(workingWeeklySchedule.id, id));
  if (!isSchedule) {
    throw new ApiError(404, "Schedule not found");
  }

  await db
    .delete(workingWeeklySchedule)
    .where(eq(workingWeeklySchedule.id, id));

  return res
    .status(200)
    .json(new ApiResponse(200, "Schedule Deleted Successfully", {}));
});

const getWeeklySchedule = asyncHandler(async (req, res) => {
  const { scheduleId } = req.params;

  const [schedule] = await db
    .select()
    .from(workingWeeklySchedule)
    .where(eq(workingWeeklySchedule.id, scheduleId));
  if (!schedule) {
    throw new ApiError(404, "Schedule not found");
  }

  const days = await db
    .select()
    .from(workingDaySchedule)
    .where(eq(workingDaySchedule.workingWeeklyScheduleId, scheduleId));

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Schedule Fetched Successfully", { schedule, days }),
    );
});

const getAllSchedules = asyncHandler(async (req, res) => {
  const schedules = await db.select().from(workingWeeklySchedule);
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Schedules Fetched Successfully", { schedules }),
    );
});

const getEmployeeSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [empRecord] = await db
    .select()
    .from(employee)
    .where(eq(employee.id, id));
  if (!empRecord) {
    throw new ApiError(404, "Employee not found");
  }

  const scheduleId = empRecord.workingWeeklyScheduleId;
  if (!scheduleId) {
    throw new ApiError(404, "No schedule assigned to this employee");
  }

  const [schedule] = await db
    .select({ id: workingWeeklySchedule.id, name: workingWeeklySchedule.name })
    .from(workingWeeklySchedule)
    .where(eq(workingWeeklySchedule.id, scheduleId));

  if (!schedule) {
    throw new ApiError(404, "Schedule not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Schedule Fetched Successfully", { schedule }));
});

export default {
  createSchedule,
  addIndividualDay,
  deleteDay,
  deleteSchedule,
  getWeeklySchedule,
  getAllSchedules,
  getEmployeeSchedule,
};
