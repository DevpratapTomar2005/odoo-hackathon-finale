import { z } from "zod";

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid ID format. Must be a valid UUIDv7 string"),
  }),
});

export const scheduleIdParamSchema = z.object({
  params: z.object({
    scheduleId: z.string().uuid("Invalid Schedule ID format. Must be a valid UUIDv7 string"),
  }),
});

export const createScheduleSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Schedule name is required"),
    workingDays: z.number().int().min(1).max(7, "Working days must be between 1 and 7"),
    workingHours: z.number().min(0, "Working hours cannot be negative"),
    startTime: z.string().regex(/^([0-1]\d|2[0-3]):([0-5]\d)$/, "Invalid start time format (HH:MM)"),
    endTime: z.string().regex(/^([0-1]\d|2[0-3]):([0-5]\d)$/, "Invalid end time format (HH:MM)"),
    breakMinutes: z.number().int().min(0, "Break minutes cannot be negative"),
    dayHours: z.number().min(0, "Day hours cannot be negative"),
    dailySchedule: z.array(
      z.object({
        day: z.string().min(1).transform((val) => val.toUpperCase()),
        startTime: z.string().regex(/^([0-1]\d|2[0-3]):([0-5]\d)$/, "Invalid format").optional(),
        endTime: z.string().regex(/^([0-1]\d|2[0-3]):([0-5]\d)$/, "Invalid format").optional(),
        breakMinutes: z.number().int().min(0).optional(),
        dayHours: z.number().min(0).optional(),
      })
    ).min(1, "At least one daily schedule entry is required"),
  }),
});

export const addIndividualDaySchema = z.object({
  body: z.object({
    workingWeeklyScheduleId: z.string().uuid("Invalid Weekly Schedule ID format"),
    day: z.string().min(1).transform((val) => val.toUpperCase()),
    startTime: z.string().regex(/^([0-1]\d|2[0-3]):([0-5]\d)$/, "Invalid format (HH:MM)"),
    endTime: z.string().regex(/^([0-1]\d|2[0-3]):([0-5]\d)$/, "Invalid format (HH:MM)"),
    breakMinutes: z.number().int().min(0, "Break minutes cannot be negative"),
    dayHours: z.number().min(0, "Day hours cannot be negative"),
  }),
});
