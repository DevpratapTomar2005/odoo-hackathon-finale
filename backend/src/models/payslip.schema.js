import { z } from "zod";

export const employeeIdParamSchema = z.object({
  params: z.object({
    employeeId: z.string().uuid(),
  }),
});

export const payslipIdParamSchema = z.object({
  params: z.object({
    payslipId: z.string().uuid(),
  }),
});