import { z } from "zod";

export const createTimeOffTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    unit: z.enum(["DAY", "HOUR"]),
    allocationNeed: z.enum(["REQUIRED", "NOT_REQUIRED"]),
    displayColour: z.enum(["BLUE", "GREEN", "RED", "ORANGE"]),
    status: z.enum(["ACTIVE", "INACTIVE"]),
  }),
});

export const editTimeOffTypeSchema = z.object({
  params: z.object({
    timeoffTypeId: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    unit: z.enum(["DAY", "HOUR"]).optional(),
    allocationNeed: z.enum(["REQUIRED", "NOT_REQUIRED"]).optional(),
    displayColour: z.enum(["BLUE", "GREEN", "RED", "ORANGE"]).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  }),
});

export const createTimeOffRequestSchema = z.object({
  params: z.object({
    employeeId: z.string().uuid(),
  }),
  body: z.object({
    startDate: z.string().date(),
    endDate: z.string().date(),
    timeoffType: z.string().uuid(),
    reason: z.string().min(1).max(255),
  }),
});

export const timeoffIdParamSchema = z.object({
  params: z.object({
    timeoffId: z.string().uuid(),
  }),
});

export const employeeIdParamSchema = z.object({
  params: z.object({
    employeeId: z.string().uuid(),
  }),
});