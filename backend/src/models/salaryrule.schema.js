import { z } from "zod";

const categoryEnum = z.enum(["BASIC", "ALLOWANCE", "DEDUCTION"]);
const computationMethodEnum = z.enum(["FIXED", "PERCENTAGE", "FORMULA"]);

export const createSalaryRuleSchema = z.object({
  params: z.object({
    salaryStructureId: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(100),
    code: z.string().min(1).max(50),
    category: categoryEnum,
    sequence: z.number().int(),
    computationMethod: computationMethodEnum,
    amount: z.number().optional(),
    percentage: z.number().optional(),
    percentageBaseCode: z.string().max(50).optional(),
    formula: z.string().max(500).optional(),
  }),
});

export const editSalaryRuleSchema = z.object({
  params: z.object({
    salaryRuleId: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    code: z.string().min(1).max(50).optional(),
    category: categoryEnum.optional(),
    sequence: z.number().int().optional(),
    computationMethod: computationMethodEnum.optional(),
    amount: z.number().optional(),
    percentage: z.number().optional(),
    percentageBaseCode: z.string().max(50).optional(),
    formula: z.string().max(500).optional(),
  }),
});

export const salaryStructureIdParamSchema = z.object({
  params: z.object({
    salaryStructureId: z.string().uuid(),
  }),
});

export const salaryRuleIdParamSchema = z.object({
  params: z.object({
    salaryRuleId: z.string().uuid(),
  }),
});