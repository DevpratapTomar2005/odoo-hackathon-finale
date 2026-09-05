import React from "react";
import { useParams, useNavigate } from "react-router";
import {
  usePayrun,
  useSalaryStructure,
  useComputePayrun,
  useValidatePayrun,
  useMarkPaidPayrun,
  useSendPayslips,
} from "../../hooks/usePayroll.js";
import { useEmployees } from "../../hooks/useEmployee.js";
import { Badge } from "../../components/common/Badge.jsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.jsx";
import { useDispatch } from "react-redux";
import { addToast } from "../../store/slices/uiSlice.js";
import {
  ArrowLeft,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  Mail,
  AlertTriangle,
  ChevronRight,
  Calendar,
  Layers,
} from "lucide-react";

export function PayrunDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: payrunRes, isLoading: payrunLoading } = usePayrun(id);
  const payrun = payrunRes?.data;

  const { data: structRes } = useSalaryStructure(payrun?.salaryStructureId);
  const structure = structRes?.data;

  const { data: empRes } = useEmployees();
  const employees = empRes?.data || [];

  const computeMutation = useComputePayrun();
  const validateMutation = useValidatePayrun();
  const markPaidMutation = useMarkPaidPayrun();
  const sendPayslipsMutation = useSendPayslips();

  const isProcessing =
    computeMutation.isPending ||
    validateMutation.isPending ||
    markPaidMutation.isPending ||
    sendPayslipsMutation.isPending;

  const handleCompute = () => {
    computeMutation.mutate(id, {
      onSuccess: () => {
        dispatch(addToast({ type: "success", title: "Computed", message: "All employee payslips calculated against active contracts." }));
      },
      onError: (err) => {
        dispatch(addToast({ type: "error", title: "Computation Failed", message: err.message }));
      },
    });
  };

  const handleValidate = () => {
    validateMutation.mutate(id, {
      onSuccess: () => {
        dispatch(addToast({ type: "success", title: "Validated", message: "Payrun locked and validated." }));
      },
      onError: (err) => {
        dispatch(addToast({ type: "error", title: "Validation Failed", message: err.message }));
      },
    });
  };

  const handleMarkPaid = () => {
    markPaidMutation.mutate(id, {
      onSuccess: () => {
        dispatch(addToast({ type: "success", title: "Marked Paid", message: "Payrun finalized and marked as paid." }));
      },
      onError: (err) => {
        dispatch(addToast({ type: "error", title: "Payment Failed", message: err.message }));
      },
    });
  };

  const handleSendEmails = () => {
    sendPayslipsMutation.mutate(id, {
      onSuccess: (res) => {
        dispatch(addToast({ type: "success", title: "Emails Dispatched", message: res?.message || "Payslips sent to employees." }));
      },
      onError: (err) => {
        dispatch(addToast({ type: "error", title: "Email Delivery Failed", message: err.message }));
      },
    });
  };

  if (payrunLoading || !payrun) {
    return <LoadingSpinner text="Loading payrun workstation..." />;
  }

  const employeeMap = Object.fromEntries(employees.map((e) => [e.id, e]));
  const payslipsList = payrun.payslips || [];

  const totalGross = payslipsList.reduce((acc, p) => acc + Number(p.grossSalary || 0), 0);
  const totalNet = payslipsList.reduce((acc, p) => acc + Number(p.netSalary || 0), 0);
  const warningsCount = payslipsList.filter((p) => p.warnings).length;

  const steps = ["DRAFT", "COMPUTED", "VALIDATED", "PAID"];
  const currentStepIdx = steps.indexOf(payrun.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/payroll")}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Payruns</span>
        </button>

        <div className="flex items-center gap-2">
          <Badge variant={payrun.status}>{payrun.status}</Badge>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{payrun.name}</h1>
            <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">{payrun.periodStart} → {payrun.periodEnd}</span>
              </span>
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>{structure?.name || "Structure"}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {payrun.status === "DRAFT" && (
              <button
                onClick={handleCompute}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Calculator className="w-4 h-4" />
                <span>{computeMutation.isPending ? "Computing..." : "Compute Salary"}</span>
              </button>
            )}

            {payrun.status === "COMPUTED" && (
              <>
                <button
                  onClick={handleCompute}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Re-Compute</span>
                </button>
                <button
                  onClick={handleValidate}
                  disabled={isProcessing || warningsCount > 0}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Validate Payrun</span>
                </button>
              </>
            )}

            {payrun.status === "VALIDATED" && (
              <>
                <button
                  onClick={handleMarkPaid}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark as Paid</span>
                </button>
                <button
                  onClick={handleSendEmails}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span>Send Payslips via Email</span>
                </button>
              </>
            )}

            {payrun.status === "PAID" && (
              <button
                onClick={handleSendEmails}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Mail className="w-4 h-4 text-indigo-600" />
                <span>Resend Payslips</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between max-w-xl mx-auto py-2">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div key={step} className="flex items-center gap-2 flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${isCompleted ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-400"}`}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={`text-xs font-semibold ${isCurrent ? "text-indigo-600 font-bold" : isCompleted ? "text-slate-800" : "text-slate-400"}`}
                  >
                    {step}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 ${idx < currentStepIdx ? "bg-indigo-600" : "bg-slate-200"}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Staff</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{payslipsList.length}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Gross</p>
            <p className="text-xl font-bold text-slate-900 mt-1">₹{totalGross.toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Net</p>
            <p className="text-xl font-bold text-emerald-700 mt-1">₹{totalNet.toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Warnings</p>
            <p className={`text-xl font-bold mt-1 ${warningsCount > 0 ? "text-rose-600" : "text-slate-400"}`}>
              {warningsCount}
            </p>
          </div>
        </div>

        {warningsCount > 0 && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                {warningsCount} payslips require attention prior to validation
              </h4>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Active employment contract records must overlap the payrun period ({payrun.periodStart} to {payrun.periodEnd}).
              </p>
            </div>
          </div>
        )}

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Basic Salary</th>
                <th className="px-4 py-3">Gross Salary</th>
                <th className="px-4 py-3">Net Salary</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Validation Warning</th>
                <th className="px-4 py-3 text-right">Payslip Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {payslipsList.map((slip) => {
                const emp = employeeMap[slip.employeeId];
                return (
                  <tr
                    key={slip.id}
                    onClick={() => navigate(`/payroll/payslip/${slip.id}`)}
                    className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-900 block">
                        {emp ? `${emp.firstName} ${emp.lastName}` : `Staff #${slip.employeeId?.slice(0, 8)}`}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {emp ? `${emp.department} • #${emp.employeeId}` : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      ₹{Number(slip.basicSalary || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      ₹{Number(slip.grossSalary || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-700">
                      ₹{Number(slip.netSalary || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={slip.status}>{slip.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {slip.warnings ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          {slip.warnings}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-indigo-600 font-semibold flex items-center justify-end gap-1 hover:underline">
                        View Lines <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
