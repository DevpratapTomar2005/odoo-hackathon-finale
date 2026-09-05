import React, { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { usePayslip } from "../../hooks/usePayroll.js";
import { useEmployee } from "../../hooks/useEmployee.js";
import { payrollService } from "../../services/api/payroll.service.js";
import { Badge } from "../../components/common/Badge.jsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.jsx";
import {
  ArrowLeft,
  Download,
  Building2,
  Briefcase,
} from "lucide-react";

export function PayslipDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: payslipRes, isLoading: payslipLoading } = usePayslip(id);
  const payslip = payslipRes?.data;

  const { data: empRes } = useEmployee(payslip?.employeeId);
  const employee = empRes?.data;

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await payrollService.downloadPayslipPdf(id, `payslip-${id}.pdf`);
    } catch (err) {
    } finally {
      setDownloading(false);
    }
  };

  if (payslipLoading || !payslip) {
    return <LoadingSpinner text="Generating payslip calculation breakdown..." />;
  }

  const lines = payslip.lines || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <Badge variant={payslip.status}>{payslip.status}</Badge>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? "Downloading..." : "Download Official PDF"}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
              Official Employee Payslip
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-2">
              {employee ? `${employee.department} - #${employee.employeeId}` : `Payslip #${payslip.id.slice(0, 8)}`}
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>{employee?.designation || "Staff Position"}</span>
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{employee?.department || "General"}</span>
              </span>
            </p>
          </div>

          <div className="text-right p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Net Payable Salary
            </span>
            <span className="text-2xl font-bold text-emerald-700">
              ₹{Number(payslip.netSalary || 0).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Basic Wage Base
            </span>
            <span className="text-lg font-bold text-slate-900 mt-1 block">
              ₹{Number(payslip.basicSalary || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Gross Earnings Total
            </span>
            <span className="text-lg font-bold text-slate-900 mt-1 block">
              ₹{Number(payslip.grossSalary || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Net Payout
            </span>
            <span className="text-lg font-bold text-emerald-700 mt-1 block">
              ₹{Number(payslip.netSalary || 0).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3">Salary Rules Computation Breakdown</h3>
          {lines.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
              No individual lines calculated yet. Compute the payrun to execute the salary rule sequence.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Sequence</th>
                    <th className="px-4 py-3">Rule Name</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Computed Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {lines.map((line) => (
                    <tr key={line.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono text-slate-400">{line.sequence}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{line.name}</td>
                      <td className="px-4 py-3 font-mono text-indigo-600 font-bold">{line.code}</td>
                      <td className="px-4 py-3">
                        <Badge variant={line.category === "DEDUCTION" ? "danger" : "success"}>
                          {line.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {line.category === "DEDUCTION" ? "-" : "+"}₹{Number(line.amount).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
