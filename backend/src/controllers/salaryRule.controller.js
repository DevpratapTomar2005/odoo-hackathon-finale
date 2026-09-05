import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { salaryRule, salaryStructure } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { evaluateFormula } from "../utils/formulaEvaluator.js";

const createSalaryRule = asyncHandler(async (req, res) => {
  const { salaryStructureId } = req.params;
  const {
    name,
    code,
    category,
    sequence,
    computationMethod,
    amount,
    percentage,
    percentageBaseCode,
    formula,
  } = req.body;

  const [existingStructure] = await db
    .select()
    .from(salaryStructure)
    .where(eq(salaryStructure.id, salaryStructureId));

  if (!existingStructure) {
    throw new ApiError(404, "Salary structure does not exist");
  }

  if (
    computationMethod === "FIXED" &&
    code !== "BASIC" &&
    amount === undefined
  ) {
    throw new ApiError(400, "Amount is required for a fixed rule");
  }

  if (
    computationMethod === "PERCENTAGE" &&
    (!percentage || !percentageBaseCode)
  ) {
    throw new ApiError(
      400,
      "Percentage and percentageBaseCode are required for a percentage rule",
    );
  }

  if (computationMethod === "FORMULA") {
    if (!formula) {
      throw new ApiError(400, "Formula is required for a formula-based rule");
    }

    // Sanity-check the formula parses; unknown rule-code references (which can
    // only be known at compute time) are allowed to fail here and will be
    // caught during payrun computation instead.
    try {
      evaluateFormula(formula, { GROSS: 0, DEDUCTIONS: 0, NET: 0 });
    } catch (err) {
      if (!/Unknown reference/.test(err.message)) {
        throw new ApiError(400, `Invalid formula: ${err.message}`);
      }
    }
  }

  const [newRule] = await db
    .insert(salaryRule)
    .values({
      salaryStructureId: existingStructure.id,
      name,
      code,
      category,
      sequence,
      computationMethod,
      amount,
      percentage,
      percentageBaseCode,
      formula,
    })
    .returning();

  if (!newRule) {
    throw new ApiError(400, "Failed to create salary rule");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, "Salary rule created successfully", newRule));
});

const editSalaryRule = asyncHandler(async (req, res) => {
  const { salaryRuleId } = req.params;
  const {
    name,
    code,
    category,
    sequence,
    computationMethod,
    amount,
    percentage,
    percentageBaseCode,
    formula,
  } = req.body;

  const [existingRule] = await db
    .select()
    .from(salaryRule)
    .where(eq(salaryRule.id, salaryRuleId));

  if (!existingRule) {
    throw new ApiError(404, "Salary rule not found");
  }

  const effectiveComputationMethod =
    computationMethod ?? existingRule.computationMethod;
  const effectiveFormula = formula ?? existingRule.formula;

  if (effectiveComputationMethod === "FORMULA" && !effectiveFormula) {
    throw new ApiError(400, "Formula is required for a formula-based rule");
  }

  if (formula !== undefined) {
    try {
      evaluateFormula(formula, { GROSS: 0, DEDUCTIONS: 0, NET: 0 });
    } catch (err) {
      if (!/Unknown reference/.test(err.message)) {
        throw new ApiError(400, `Invalid formula: ${err.message}`);
      }
    }
  }

  const updateObj = {};

  if (name) {
    updateObj.name = name;
  }

  if (code) {
    updateObj.code = code;
  }

  if (category) {
    updateObj.category = category;
  }

  if (sequence !== undefined) {
    updateObj.sequence = sequence;
  }

  if (computationMethod) {
    updateObj.computationMethod = computationMethod;
  }

  if (amount !== undefined) {
    updateObj.amount = amount;
  }

  if (percentage !== undefined) {
    updateObj.percentage = percentage;
  }

  if (percentageBaseCode !== undefined) {
    updateObj.percentageBaseCode = percentageBaseCode;
  }

  if (formula !== undefined) {
    updateObj.formula = formula;
  }

  const [updatedRule] = await db
    .update(salaryRule)
    .set(updateObj)
    .where(eq(salaryRule.id, salaryRuleId))
    .returning();

  if (!updatedRule) {
    throw new ApiError(400, "Failed to edit salary rule");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Salary rule edited successfully", updatedRule));
});

const getSalaryRulesByStructure = asyncHandler(async (req, res) => {
  const { salaryStructureId } = req.params;

  const rules = await db
    .select()
    .from(salaryRule)
    .where(eq(salaryRule.salaryStructureId, salaryStructureId))
    .orderBy(salaryRule.sequence);

  return res
    .status(200)
    .json(new ApiResponse(200, "Salary rules fetched successfully", rules));
});

const getSalaryRuleById = asyncHandler(async (req, res) => {
  const { salaryRuleId } = req.params;

  const [existingRule] = await db
    .select()
    .from(salaryRule)
    .where(eq(salaryRule.id, salaryRuleId));

  if (!existingRule) {
    throw new ApiError(404, "Salary rule not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Salary rule fetched successfully", existingRule),
    );
});

export default {
  createSalaryRule,
  editSalaryRule,
  getSalaryRulesByStructure,
  getSalaryRuleById,
};