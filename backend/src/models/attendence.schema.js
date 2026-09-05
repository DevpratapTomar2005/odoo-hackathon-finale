import { z } from "zod";

export const checkInSchema = z.object({
  params: z.object({
    employeeId: z.uuid("Invalid Employee ID format. Must be a valid UUIDv7 string"),
  }),
});

export const checkOutSchema = z.object({
  params: z.object({
    attendanceId: z.uuid("Invalid Attendance ID format. Must be a valid UUIDv7 string"),
  }),
  body: z.object({
    overtimeHours: z.number().int().min(0, "Overtime hours cannot be negative").optional().nullable(),
  }),
});

export const getAttendanceByDateSchema = z.object({
  params: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD"),
  }),
});

export const getAttendanceByEmployeeSchema = z.object({
  params: z.object({
    employeeId: z.uuid("Invalid Employee ID format. Must be a valid UUIDv7 string"),
  }),
});
