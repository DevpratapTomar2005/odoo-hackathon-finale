import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  payrun,
  payslip,
  payslipLine,
  salaryStructure,
  salaryRule,
  employee,
  contract,
  user,
} from "../db/schema.js";
import { eq, and, or, isNull, lte, gte, inArray, asc, desc } from "drizzle-orm";
import { db } from "../db/db.js";
import { evaluateFormula } from "../utils/formulaEvaluator.js";
import { generatePayslipPdf } from "../utils/generatePayslipPdf.js";
import { sendMail } from "../services/email.service.js";

const createPayrun = asyncHandler(async (req, res) => {
  const { name, periodStart, periodEnd, salaryStructureId, employeeIds } =
    req.body;

  const [existingStructure] = await db
    .select()
    .from(salaryStructure)
    .where(eq(salaryStructure.id, salaryStructureId));

  if (!existingStructure) {
    throw new ApiError(404, "Salary structure does not exist");
  }

  const uniqueEmployeeIds = [...new Set(employeeIds)];

  const selectedEmployees = await db
    .select()
    .from(employee)
    .where(inArray(employee.id, uniqueEmployeeIds));

  if (selectedEmployees.length !== uniqueEmployeeIds.length) {
    throw new ApiError(404, "One or more employees do not exist");
  }

  const newPayrun = await db.transaction(async (tx) => {
    const [createdPayrun] = await tx
      .insert(payrun)
      .values({
        name,
        periodStart,
        periodEnd,
        salaryStructureId: existingStructure.id,
      })
      .returning();

    if (!createdPayrun) {
      throw new ApiError(400, "Failed to create payrun");
    }

    const payslipValues = selectedEmployees.map((emp) => ({
      payrunId: createdPayrun.id,
      employeeId: emp.id,
    }));

    await tx.insert(payslip).values(payslipValues);

    return createdPayrun;
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Payrun created successfully", newPayrun));
});

const computePayrun = asyncHandler(async (req, res) => {
  const { payrunId } = req.params;

  const [existingPayrun] = await db
    .select()
    .from(payrun)
    .where(eq(payrun.id, payrunId));

  if (!existingPayrun) {
    throw new ApiError(404, "Payrun does not exist");
  }

  const structureRules = await db
    .select()
    .from(salaryRule)
    .where(eq(salaryRule.salaryStructureId, existingPayrun.salaryStructureId))
    .orderBy(asc(salaryRule.sequence));

  if (structureRules.length === 0) {
    throw new ApiError(400, "Salary structure has no rules configured");
  }

  const payrunPayslips = await db
    .select()
    .from(payslip)
    .where(eq(payslip.payrunId, payrunId));

  if (payrunPayslips.length === 0) {
    throw new ApiError(404, "No payslips found for this payrun");
  }

  await db.transaction(async (tx) => {
    for (const currentPayslip of payrunPayslips) {
      const [activeContract] = await tx
        .select()
        .from(contract)
        .where(
          and(
            eq(contract.employeeId, currentPayslip.employeeId),
            eq(contract.status, "ACTIVE"),
            lte(contract.startDate, existingPayrun.periodEnd),
            or(
              isNull(contract.endDate),
              gte(contract.endDate, existingPayrun.periodStart),
            ),
          ),
        );

      if (!activeContract) {
        await tx
          .update(payslip)
          .set({ warnings: "No active contract found for this period" })
          .where(eq(payslip.id, currentPayslip.id));
        continue;
      }

      const lines = [];
      let grossTotal = 0;
      let deductionTotal = 0;

      for (const rule of structureRules) {
        let amount;

        if (rule.code === "BASIC") {
          amount = Number(activeContract.salary);
        } else if (rule.computationMethod === "FIXED") {
          amount = Number(rule.amount);
        } else if (rule.computationMethod === "PERCENTAGE") {
          const baseLine = lines.find(
            (line) => line.code === rule.percentageBaseCode,
          );

          if (!baseLine) {
            throw new ApiError(
              400,
              `Base rule ${rule.percentageBaseCode} not found before rule ${rule.code}`,
            );
          }

          amount = (Number(rule.percentage) / 100) * baseLine.amount;
        } else {
          // FORMULA: expression can reference any rule code computed earlier
          // in the sequence, plus the running GROSS / DEDUCTIONS / NET totals.
          if (!rule.formula) {
            throw new ApiError(
              400,
              `Rule ${rule.code} is FORMULA-based but has no formula configured`,
            );
          }

          const scope = {
            GROSS: grossTotal,
            DEDUCTIONS: deductionTotal,
            NET: grossTotal - deductionTotal,
          };
          for (const line of lines) {
            scope[line.code] = line.amount;
          }

          try {
            amount = evaluateFormula(rule.formula, scope);
          } catch (err) {
            throw new ApiError(
              400,
              `Formula error in rule ${rule.code}: ${err.message}`,
            );
          }
        }

        lines.push({
          code: rule.code,
          name: rule.name,
          category: rule.category,
          amount,
          sequence: rule.sequence,
          salaryRuleId: rule.id,
        });

        if (rule.category === "DEDUCTION") {
          deductionTotal += amount;
        } else {
          grossTotal += amount;
        }
      }

      const netTotal = grossTotal - deductionTotal;

      await tx
        .delete(payslipLine)
        .where(eq(payslipLine.payslipId, currentPayslip.id));

      await tx.insert(payslipLine).values(
        lines.map((line) => ({
          payslipId: currentPayslip.id,
          salaryRuleId: line.salaryRuleId,
          name: line.name,
          code: line.code,
          category: line.category,
          amount: String(line.amount),
          sequence: line.sequence,
        })),
      );

      await tx
        .update(payslip)
        .set({
          contractId: activeContract.id,
          basicSalary: String(activeContract.salary),
          grossSalary: String(grossTotal),
          netSalary: String(netTotal),
          status: "COMPUTED",
          warnings: null,
        })
        .where(eq(payslip.id, currentPayslip.id));
    }

    await tx
      .update(payrun)
      .set({ status: "COMPUTED" })
      .where(eq(payrun.id, payrunId));
  });

  const [updatedPayrun] = await db
    .select()
    .from(payrun)
    .where(eq(payrun.id, payrunId));

  return res
    .status(200)
    .json(new ApiResponse(200, "Payrun computed successfully", updatedPayrun));
});

const validatePayrun = asyncHandler(async (req, res) => {
  const { payrunId } = req.params;

  const [existingPayrun] = await db
    .select()
    .from(payrun)
    .where(eq(payrun.id, payrunId));

  if (!existingPayrun) {
    throw new ApiError(404, "Payrun does not exist");
  }

  if (existingPayrun.status !== "COMPUTED") {
    throw new ApiError(400, "Payrun must be computed before validation");
  }

  const payrunPayslips = await db
    .select()
    .from(payslip)
    .where(eq(payslip.payrunId, payrunId));

  const hasWarnings = payrunPayslips.some((slip) => slip.warnings);

  if (hasWarnings) {
    throw new ApiError(400, "Cannot validate payrun with unresolved warnings");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(payslip)
      .set({ status: "VALIDATED" })
      .where(eq(payslip.payrunId, payrunId));

    await tx
      .update(payrun)
      .set({ status: "VALIDATED" })
      .where(eq(payrun.id, payrunId));
  });

  const [updatedPayrun] = await db
    .select()
    .from(payrun)
    .where(eq(payrun.id, payrunId));

  return res
    .status(200)
    .json(new ApiResponse(200, "Payrun validated successfully", updatedPayrun));
});

const markPayrunPaid = asyncHandler(async (req, res) => {
  const { payrunId } = req.params;

  const [existingPayrun] = await db
    .select()
    .from(payrun)
    .where(eq(payrun.id, payrunId));

  if (!existingPayrun) {
    throw new ApiError(404, "Payrun does not exist");
  }

  if (existingPayrun.status !== "VALIDATED") {
    throw new ApiError(400, "Payrun must be validated before marking as paid");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(payslip)
      .set({ status: "PAID" })
      .where(eq(payslip.payrunId, payrunId));

    await tx
      .update(payrun)
      .set({ status: "PAID" })
      .where(eq(payrun.id, payrunId));
  });

  const [updatedPayrun] = await db
    .select()
    .from(payrun)
    .where(eq(payrun.id, payrunId));

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Payrun marked as paid successfully", updatedPayrun),
    );
});


const sendPayslips = asyncHandler(async (req, res) => {
  const { payrunId } = req.params;

  const [existingPayrun] = await db
    .select()
    .from(payrun)
    .where(eq(payrun.id, payrunId));

  if (!existingPayrun) {
    throw new ApiError(404, "Payrun does not exist");
  }

  if (!["VALIDATED", "PAID"].includes(existingPayrun.status)) {
    throw new ApiError(
      400,
      "Payrun must be validated before payslips can be sent",
    );
  }

  const payrunPayslips = await db
    .select()
    .from(payslip)
    .where(eq(payslip.payrunId, payrunId));

  if (payrunPayslips.length === 0) {
    throw new ApiError(404, "No payslips found for this payrun");
  }

  const results = [];

  for (const currentPayslip of payrunPayslips) {
    const [payslipEmployee] = await db
      .select()
      .from(employee)
      .where(eq(employee.id, currentPayslip.employeeId));

    if (!payslipEmployee) {
      results.push({
        payslipId: currentPayslip.id,
        status: "failed",
        reason: "Employee record not found",
      });
      continue;
    }

    const [employeeUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, payslipEmployee.userId));

    if (!employeeUser || !employeeUser.email) {
      results.push({
        payslipId: currentPayslip.id,
        status: "failed",
        reason: "Employee email not found",
      });
      continue;
    }

    const lines = await db
      .select()
      .from(payslipLine)
      .where(eq(payslipLine.payslipId, currentPayslip.id));

    try {
      const pdfBuffer = await generatePayslipPdf({
        payslip: currentPayslip,
        lines,
        employee: payslipEmployee,
        payrun: existingPayrun,
      });

      await sendMail({
        to: employeeUser.email,
        subject: `Payslip - ${existingPayrun.name}`,
        text: `Dear ${employeeUser.firstName},\n\nPlease find attached your payslip for ${existingPayrun.name} (${existingPayrun.periodStart} to ${existingPayrun.periodEnd}).\n\nRegards,\nPeoplePay360`,
        attachments: [
          {
            filename: `payslip-${currentPayslip.id}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      results.push({ payslipId: currentPayslip.id, status: "sent" });
    } catch (err) {
      results.push({
        payslipId: currentPayslip.id,
        status: "failed",
        reason: err.message,
      });
    }
  }

  const failedCount = results.filter((r) => r.status === "failed").length;
  const sentCount = results.length - failedCount;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        `Payslips processed: ${sentCount} sent, ${failedCount} failed`,
        results,
      ),
    );
});

const getAllPayruns = asyncHandler(async (req, res) => {
  const allPayruns = await db.select().from(payrun).orderBy(desc(payrun.createdAt));

  return res
    .status(200)
    .json(new ApiResponse(200, "Payruns fetched successfully", allPayruns));
});

const getPayrunById = asyncHandler(async (req, res) => {
  const { payrunId } = req.params;

  const [existingPayrun] = await db
    .select()
    .from(payrun)
    .where(eq(payrun.id, payrunId));

  if (!existingPayrun) {
    throw new ApiError(404, "Payrun does not exist");
  }

  const payrunPayslips = await db
    .select()
    .from(payslip)
    .where(eq(payslip.payrunId, payrunId));

  return res.status(200).json(
    new ApiResponse(200, "Payrun fetched successfully", {
      ...existingPayrun,
      payslips: payrunPayslips,
    }),
  );
});

export default {
  createPayrun,
  computePayrun,
  validatePayrun,
  markPayrunPaid,
  sendPayslips,
  getAllPayruns,
  getPayrunById,
};