import { z } from "zod";

export const createPayrunSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    periodStart: z.string(),
    periodEnd: z.string(),
    salaryStructureId: z.string().uuid(),
    employeeIds: z.array(z.string().uuid()).min(1),
  }),
});

export const payrunIdParamSchema = z.object({
  params: z.object({
    payrunId: z.string().uuid(),
  }),
});