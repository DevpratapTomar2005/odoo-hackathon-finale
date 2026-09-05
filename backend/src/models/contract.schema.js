import { z } from "zod";

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid ID format"),
  }),
});

export const createContractSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional().nullable(),
    salary: z.number().int().min(0, "Salary cannot be negative"),
    status: z.enum(["ACTIVE", "EXPIRED"], { message: "Invalid status value" }),
    validity: z.number().int().min(2000).max(2100, "Validity must be a valid year"),
    employeeId: z.string().uuid("Invalid Employee ID format"), 
  }),
});

export const updateContractSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid Contract ID format"), // ✅ fixed
  }),
  body: z.object({
    name: z.string().min(1, "Name is required").optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional().nullable(),
    salary: z.number().int().min(0, "Salary cannot be negative").optional(),
    status: z.enum(["ACTIVE", "EXPIRED"], { message: "Invalid status value" }).optional(),
    validity: z.number().int().min(2000).max(2100).optional(),
    employeeId: z.string().uuid("Invalid Employee ID format").optional(),
  }),
});
