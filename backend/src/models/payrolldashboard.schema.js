import { z } from "zod";

export const getPayrollDashboardSchema = z.object({
  query: z.object({
    periodStart: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "periodStart must be YYYY-MM-DD")
      .optional(),
    periodEnd: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "periodEnd must be YYYY-MM-DD")
      .optional(),
    department: z.string().optional(),
    employeeStatus: z.enum(["ACTIVE", "RESIGNED", "TERMINATED"]).optional(),
  }),
});