import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { payslip, payslipLine, employee, payrun } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/db.js";
import { generatePayslipPdf } from "../utils/generatePayslipPdf.js";

const getAllPayslips = asyncHandler(async (req, res) => {
  const allPayslips = await db.select().from(payslip).orderBy(desc(payslip.createdAt));

  return res
    .status(200)
    .json(new ApiResponse(200, "Payslips fetched successfully", allPayslips));
});

const getPayslipsByEmployee = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;

  const employeePayslips = await db
    .select()
    .from(payslip)
    .where(eq(payslip.employeeId, employeeId))
    .orderBy(desc(payslip.createdAt));

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Payslips fetched successfully", employeePayslips),
    );
});

const getPayslipById = asyncHandler(async (req, res) => {
  const { payslipId } = req.params;

  const [existingPayslip] = await db
    .select()
    .from(payslip)
    .where(eq(payslip.id, payslipId));

  if (!existingPayslip) {
    throw new ApiError(404, "Payslip does not exist");
  }

  const lines = await db
    .select()
    .from(payslipLine)
    .where(eq(payslipLine.payslipId, payslipId));

  return res.status(200).json(
    new ApiResponse(200, "Payslip fetched successfully", {
      ...existingPayslip,
      lines,
    }),
  );
});

// B8: streams back a generated PDF for a single payslip.
const printPayslip = asyncHandler(async (req, res) => {
  const { payslipId } = req.params;

  const [existingPayslip] = await db
    .select()
    .from(payslip)
    .where(eq(payslip.id, payslipId));

  if (!existingPayslip) {
    throw new ApiError(404, "Payslip does not exist");
  }

  const lines = await db
    .select()
    .from(payslipLine)
    .where(eq(payslipLine.payslipId, payslipId));

  const [payslipEmployee] = await db
    .select()
    .from(employee)
    .where(eq(employee.id, existingPayslip.employeeId));

  if (!payslipEmployee) {
    throw new ApiError(404, "Employee not found for this payslip");
  }

  const [payslipPayrun] = await db
    .select()
    .from(payrun)
    .where(eq(payrun.id, existingPayslip.payrunId));

  if (!payslipPayrun) {
    throw new ApiError(404, "Payrun not found for this payslip");
  }

  const pdfBuffer = await generatePayslipPdf({
    payslip: existingPayslip,
    lines,
    employee: payslipEmployee,
    payrun: payslipPayrun,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=payslip-${payslipId}.pdf`,
  );

  return res.status(200).send(pdfBuffer);
});

export default {
  getAllPayslips,
  getPayslipsByEmployee,
  getPayslipById,
  printPayslip,
};