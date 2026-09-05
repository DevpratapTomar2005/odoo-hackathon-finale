import { z } from "zod";

const statusEnum = z.enum(["ACTIVE", "INACTIVE"]);

export const createSalaryStructureSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    status: statusEnum.optional(),
  }),
});

export const editSalaryStructureSchema = z.object({
  params: z.object({
    salaryStructureId: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    status: statusEnum.optional(),
  }),
});

export const salaryStructureIdParamSchema = z.object({
  params: z.object({
    salaryStructureId: z.string().uuid(),
  }),
});