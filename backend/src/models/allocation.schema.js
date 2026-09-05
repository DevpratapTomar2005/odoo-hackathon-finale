import { z } from "zod";

export const createAllocationSchema = z.object({
  params: z.object({
    employeeId: z.string().uuid(),
  }),
  body: z.object({
    timeoffTypeId: z.string().uuid(),
    allocatedDays: z.number().int().positive(),
    validityYear: z.number().int().min(2000).max(2100),
  }),
});

export const editAllocationSchema = z.object({
  params: z.object({
    allocationId: z.string().uuid(),
  }),
  body: z.object({
    allocatedDays: z.number().int().positive().optional(),
    takenDays: z.number().int().min(0).optional(),
    remainingDays: z.number().int().min(0).optional(),
    validityYear: z.number().int().min(2000).max(2100).optional(),
  }),
});

export const allocationIdParamSchema = z.object({
  params: z.object({
    allocationId: z.string().uuid(),
  }),
});

export const employeeIdParamSchema = z.object({
  params: z.object({
    employeeId: z.string().uuid(),
  }),
});