import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  payrun,
  payslip,
  employee,
  attendance,
  timeoff,
  contract,
} from "../db/schema.js";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { db } from "../db/db.js";


const getPayrollDashboard = asyncHandler(async (req, res) => {
  const { periodStart, periodEnd, department, employeeStatus } = req.query;

  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const rangeStart = periodStart || defaultStart;
  const rangeEnd = periodEnd || defaultEnd;

  const employeeFilters = [];
  if (department) employeeFilters.push(eq(employee.department, department));
  if (employeeStatus) employeeFilters.push(eq(employee.status, employeeStatus));

  const scopedEmployees = await db
    .select()
    .from(employee)
    .where(employeeFilters.length ? and(...employeeFilters) : undefined);

  if (scopedEmployees.length === 0) {
    throw new ApiError(404, "No employees found for the selected filters");
  }

  const scopedEmployeeIds = scopedEmployees.map((emp) => emp.id);
  const employeeById = Object.fromEntries(
    scopedEmployees.map((emp) => [emp.id, emp]),
  );

  // ---- Payroll: payruns whose period overlaps the requested range ----
  const payrunsInRange = await db
    .select()
    .from(payrun)
    .where(
      and(lte(payrun.periodStart, rangeEnd), gte(payrun.periodEnd, rangeStart)),
    );

  const payrunIds = payrunsInRange.map((p) => p.id);
  const payrunById = Object.fromEntries(payrunsInRange.map((p) => [p.id, p]));

  const payslipsInRange =
    payrunIds.length === 0
      ? []
      : await db
          .select()
          .from(payslip)
          .where(
            and(
              inArray(payslip.payrunId, payrunIds),
              inArray(payslip.employeeId, scopedEmployeeIds),
            ),
          );

  const paidPayslips = payslipsInRange.filter((p) => p.status === "PAID");
  const totalNetSalaryPaid = paidPayslips.reduce(
    (sum, p) => sum + Number(p.netSalary),
    0,
  );
  const totalGrossSalary = payslipsInRange.reduce(
    (sum, p) => sum + Number(p.grossSalary),
    0,
  );
  const averageSalary =
    payslipsInRange.length > 0 ? totalGrossSalary / payslipsInRange.length : 0;
  const payslipsWithWarnings = payslipsInRange.filter((p) => p.warnings);

  // ---- Chart: salary cost by department ----
  const salaryCostByDepartment = {};
  for (const slip of payslipsInRange) {
    const emp = employeeById[slip.employeeId];
    if (!emp) continue;
    salaryCostByDepartment[emp.department] =
      (salaryCostByDepartment[emp.department] || 0) + Number(slip.grossSalary);
  }

  // ---- Chart: monthly net salary trend (grouped by payrun period month) ----
  const monthlyTrendMap = {};
  for (const slip of payslipsInRange) {
    const relatedPayrun = payrunById[slip.payrunId];
    if (!relatedPayrun) continue;
    const monthKey = String(relatedPayrun.periodStart).slice(0, 7); // YYYY-MM
    monthlyTrendMap[monthKey] =
      (monthlyTrendMap[monthKey] || 0) + Number(slip.netSalary);
  }
  const monthlyNetSalaryTrend = Object.entries(monthlyTrendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, netSalary]) => ({ month, netSalary }));

  // ---- Attendance overview ----
  const attendanceInRange = await db
    .select()
    .from(attendance)
    .where(
      and(
        gte(attendance.date, rangeStart),
        lte(attendance.date, rangeEnd),
        inArray(attendance.employeeId, scopedEmployeeIds),
      ),
    );

  const presentCount = attendanceInRange.filter(
    (a) => a.status === "PRESENT",
  ).length;
  const absentCount = attendanceInRange.filter(
    (a) => a.status === "ABSENT",
  ).length;
  const missingCheckOuts = attendanceInRange.filter(
    (a) => a.checkOut === null,
  ).length;
  const totalOvertimeHours = attendanceInRange.reduce(
    (sum, a) => sum + Number(a.overtimeHours || 0),
    0,
  );
  const attendanceHealth =
    attendanceInRange.length > 0
      ? Number(((presentCount / attendanceInRange.length) * 100).toFixed(2))
      : null;

  // ---- Time off overview ----
  const timeoffInRange = await db
    .select()
    .from(timeoff)
    .where(
      and(
        gte(timeoff.startDate, new Date(rangeStart)),
        lte(timeoff.endDate, new Date(rangeEnd)),
        inArray(timeoff.employeeId, scopedEmployeeIds),
      ),
    );

  const approvedTimeOff = timeoffInRange.filter(
    (t) => t.status === "APPROVED",
  ).length;
  const pendingTimeOff = timeoffInRange.filter(
    (t) => t.status === "PENDING",
  ).length;

  // ---- Alerts: active employees without an active contract covering the range ----
  const contractsInRange = await db
    .select()
    .from(contract)
    .where(
      and(
        inArray(contract.employeeId, scopedEmployeeIds),
        eq(contract.status, "ACTIVE"),
      ),
    );
  const employeeIdsWithActiveContract = new Set(
    contractsInRange.map((c) => c.employeeId),
  );
  const employeesMissingActiveContract = scopedEmployees
    .filter(
      (emp) => emp.status === "ACTIVE" && !employeeIdsWithActiveContract.has(emp.id),
    )
    .map((emp) => ({
      employeeId: emp.id,
      department: emp.department,
      designation: emp.designation,
    }));

  return res.status(200).json(
    new ApiResponse(200, "Payroll dashboard fetched successfully", {
      filters: {
        periodStart: rangeStart,
        periodEnd: rangeEnd,
        department: department ?? null,
        employeeStatus: employeeStatus ?? null,
      },
      kpis: {
        totalNetSalaryPaid,
        payslipsGenerated: payslipsInRange.length,
        averageSalary: Number(averageSalary.toFixed(2)),
        approvedTimeOff,
        attendanceHealth,
      },
      charts: {
        salaryCostByDepartment: Object.entries(salaryCostByDepartment).map(
          ([dept, amount]) => ({ department: dept, amount }),
        ),
        monthlyNetSalaryTrend,
      },
      attendanceOverview: {
        present: presentCount,
        absent: absentCount,
        missingCheckOuts,
        totalOvertimeHours,
      },
      timeOffOverview: {
        approved: approvedTimeOff,
        pending: pendingTimeOff,
      },
      alerts: {
        payslipsWithWarnings: payslipsWithWarnings.map((p) => ({
          payslipId: p.id,
          employeeId: p.employeeId,
          warnings: p.warnings,
        })),
        employeesMissingActiveContract,
      },
    }),
  );
});

export default { getPayrollDashboard };