import React, { useState } from "react";
import { usePayrollDashboard } from "../../hooks/usePayroll.js";
import { StatCard } from "../../components/common/StatCard.jsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.jsx";
import {
  Banknote,
  FileCheck2,
  TrendingUp,
  CalendarOff,
  Activity,
  AlertTriangle,
  Building,
  CheckCircle,
  Filter,
  RefreshCw,
} from "lucide-react";

export function DashboardPage() {
  const [filters, setFilters] = useState({
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10),
    department: "",
    employeeStatus: "",
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);

  const queryParams = {};
  if (appliedFilters.periodStart) queryParams.periodStart = appliedFilters.periodStart;
  if (appliedFilters.periodEnd) queryParams.periodEnd = appliedFilters.periodEnd;
  if (appliedFilters.department) queryParams.department = appliedFilters.department;
  if (appliedFilters.employeeStatus) queryParams.employeeStatus = appliedFilters.employeeStatus;

  const { data: dashboardRes, isLoading: loading, refetch } = usePayrollDashboard(queryParams);
  const data = dashboardRes?.data;

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const attendanceOverview = data?.attendanceOverview || {};
  const timeOffOverview = data?.timeOffOverview || {};
  const alerts = data?.alerts || {};

  const handleApplyFilter = () => {
    setAppliedFilters({ ...filters });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payroll & HR Operations Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time live operational metrics across payroll, time-off, and staff attendance</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs transition-colors self-start cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Live Data</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-700">
          <Filter className="w-3.5 h-3.5 text-indigo-600" />
          <span>Analytics Scope & Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Period Start</label>
            <input
              type="date"
              value={filters.periodStart}
              onChange={(e) => setFilters({ ...filters, periodStart: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Period End</label>
            <input
              type="date"
              value={filters.periodEnd}
              onChange={(e) => setFilters({ ...filters, periodEnd: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="HR">HR</option>
              <option value="Support">Support</option>
              <option value="Finance">Finance</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Employee Status</label>
            <select
              value={filters.employeeStatus}
              onChange={(e) => setFilters({ ...filters, employeeStatus: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="RESIGNED">Resigned</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleApplyFilter}
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {loading && !data ? (
        <LoadingSpinner text="Computing operational analytics..." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Total Net Paid"
              value={`₹${Number(kpis.totalNetSalaryPaid || 0).toLocaleString("en-IN")}`}
              subtitle="Current filtered payruns"
              icon={Banknote}
              color="emerald"
            />
            <StatCard
              title="Payslips Generated"
              value={kpis.payslipsGenerated || 0}
              subtitle="Processed payslips"
              icon={FileCheck2}
              color="indigo"
            />
            <StatCard
              title="Average Salary"
              value={`₹${Number(kpis.averageSalary || 0).toLocaleString("en-IN")}`}
              subtitle="Per employee / run"
              icon={TrendingUp}
              color="sky"
            />
            <StatCard
              title="Approved Time Off"
              value={`${kpis.approvedTimeOff || 0} Days`}
              subtitle="In selected period"
              icon={CalendarOff}
              color="amber"
            />
            <StatCard
              title="Attendance Health"
              value={kpis.attendanceHealth !== null && kpis.attendanceHealth !== undefined ? `${kpis.attendanceHealth}%` : "100%"}
              subtitle="Presence ratio"
              icon={Activity}
              color="purple"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Salary Cost by Department</h3>
                  <p className="text-xs text-slate-500">Gross salary distribution</p>
                </div>
                <Building className="w-4 h-4 text-slate-400" />
              </div>

              {charts.salaryCostByDepartment?.length > 0 ? (
                <div className="space-y-3">
                  {charts.salaryCostByDepartment.map((item) => {
                    const max = Math.max(...charts.salaryCostByDepartment.map((i) => i.amount || 1), 1);
                    const pct = Math.round(((item.amount || 0) / max) * 100);
                    return (
                      <div key={item.department} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{item.department}</span>
                          <span className="text-slate-900 font-bold">₹{Number(item.amount).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                  No department payroll data for selected period
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Monthly Net Salary Trend</h3>
                  <p className="text-xs text-slate-500">Historical payout timeline</p>
                </div>
                <TrendingUp className="w-4 h-4 text-slate-400" />
              </div>

              {charts.monthlyNetSalaryTrend?.length > 0 ? (
                <div className="space-y-3">
                  {charts.monthlyNetSalaryTrend.map((t) => {
                    const max = Math.max(...charts.monthlyNetSalaryTrend.map((i) => i.netSalary || 1), 1);
                    const pct = Math.round(((t.netSalary || 0) / max) * 100);
                    return (
                      <div key={t.month} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{t.month}</span>
                          <span className="text-emerald-700 font-bold">₹{Number(t.netSalary).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                  No historical trend available for this range
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Attendance Overview</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                  <span className="text-xs font-medium text-emerald-900">Present Days</span>
                  <span className="text-xs font-bold text-emerald-700">{attendanceOverview.present || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50/60 border border-rose-100">
                  <span className="text-xs font-medium text-rose-900">Absent Exceptions</span>
                  <span className="text-xs font-bold text-rose-700">{attendanceOverview.absent || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/60 border border-amber-100">
                  <span className="text-xs font-medium text-amber-900">Missing Check-Outs</span>
                  <span className="text-xs font-bold text-amber-700">{attendanceOverview.missingCheckOuts || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100">
                  <span className="text-xs font-medium text-indigo-900">Total Overtime (Hours)</span>
                  <span className="text-xs font-bold text-indigo-700">{attendanceOverview.totalOvertimeHours || 0} hrs</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Time Off Status</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                  <span className="text-xs font-medium text-emerald-900">Approved Leaves</span>
                  <span className="text-xs font-bold text-emerald-700">{timeOffOverview.approved || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/60 border border-amber-100">
                  <span className="text-xs font-medium text-amber-900">Pending Review</span>
                  <span className="text-xs font-bold text-amber-700">{timeOffOverview.pending || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800">Operational Alerts</h3>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="space-y-2.5">
                {alerts.employeesMissingActiveContract?.length > 0 ? (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    <p className="font-semibold">{alerts.employeesMissingActiveContract.length} Active Staff Missing Contract</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">May prevent payroll computation for current pay period.</p>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>All active employees have valid contracts.</span>
                  </div>
                )}

                {alerts.payslipsWithWarnings?.length > 0 && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    <p className="font-semibold">{alerts.payslipsWithWarnings.length} Payslip Warnings</p>
                    <p className="text-[11px] text-rose-700 mt-0.5">Check payrun details to resolve contract or rule warnings.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
