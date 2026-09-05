import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { usePayruns, useAllPayslips, useSalaryStructures, useCreatePayrun } from "../../hooks/usePayroll.js";
import { useEmployees } from "../../hooks/useEmployee.js";
import { useContracts } from "../../hooks/useContract.js";
import { payrollService } from "../../services/api/payroll.service.js";
import { Badge } from "../../components/common/Badge.jsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Pagination } from "../../components/common/Pagination.jsx";
import { Combobox } from "../../components/common/Combobox.jsx";
import { useDispatch } from "react-redux";
import { addToast } from "../../store/slices/uiSlice.js";
import {
  Banknote,
  Plus,
  ArrowRight,
  FileCheck2,
  Calendar,
  Layers,
  ChevronRight,
  Download,
  AlertTriangle,
  Search,
} from "lucide-react";

export function PayrollPage() {
  const [activeTab, setActiveTab] = useState("payruns");
  const [search, setSearch] = useState("");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  const [payslipPage, setPayslipPage] = useState(1);
  const [payslipPageSize, setPayslipPageSize] = useState(10);

  const { data: payrunsRes, isLoading: payrunsLoading } = usePayruns();
  const { data: payslipsRes, isLoading: payslipsLoading } = useAllPayslips();
  const { data: structuresRes } = useSalaryStructures();
  const { data: empRes } = useEmployees();
  const { data: contractsRes } = useContracts();

  const createPayrunMutation = useCreatePayrun();

  const payruns = payrunsRes?.data || [];
  const payslips = payslipsRes?.data || [];
  const structures = structuresRes?.data || [];
  const employees = empRes?.data || [];
  const contracts = contractsRes?.data || [];

  const [wizardData, setWizardData] = useState({
    name: "",
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10),
    salaryStructureId: "",
    selectedEmployeeIds: [],
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const employeeMap = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees]);
  const structureMap = useMemo(() => Object.fromEntries(structures.map((s) => [s.id, s])), [structures]);

  const structureOptions = useMemo(() => {
    return structures.map((s) => ({
      value: s.id,
      label: s.name,
      sublabel: `Status: ${s.status}`,
    }));
  }, [structures]);

  const activeContractEmployeeSet = useMemo(() => {
    return new Set(contracts.filter((c) => c.status === "ACTIVE").map((c) => c.employeeId));
  }, [contracts]);

  const filteredPayslips = useMemo(() => {
    return payslips.filter((slip) => {
      const emp = employeeMap[slip.employeeId];
      const name = emp ? `${emp.firstName || ""} ${emp.lastName || ""}`.toLowerCase() : "";
      return name.includes(search.toLowerCase()) || String(slip.employeeId).includes(search);
    });
  }, [payslips, employeeMap, search]);

  const paginatedPayslips = useMemo(() => {
    const start = (payslipPage - 1) * payslipPageSize;
    return filteredPayslips.slice(start, start + payslipPageSize);
  }, [filteredPayslips, payslipPage, payslipPageSize]);

  const handleOpenWizard = () => {
    const monthName = new Date().toLocaleString("default", { month: "long", year: "numeric" });
    setWizardData({
      name: `${monthName} Payroll Batch`,
      periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
      periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10),
      salaryStructureId: structures[0]?.id || "",
      selectedEmployeeIds: employees.map((e) => e.id),
    });
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  const handleToggleEmployee = (id) => {
    setWizardData((prev) => {
      const exists = prev.selectedEmployeeIds.includes(id);
      return {
        ...prev,
        selectedEmployeeIds: exists
          ? prev.selectedEmployeeIds.filter((empId) => empId !== id)
          : [...prev.selectedEmployeeIds, id],
      };
    });
  };

  const handleSelectAllEmployees = () => {
    if (wizardData.selectedEmployeeIds.length === employees.length) {
      setWizardData({ ...wizardData, selectedEmployeeIds: [] });
    } else {
      setWizardData({ ...wizardData, selectedEmployeeIds: employees.map((e) => e.id) });
    }
  };

  const handleCreatePayrun = () => {
    if (!wizardData.name || !wizardData.salaryStructureId) {
      dispatch(addToast({ type: "error", title: "Incomplete", message: "Please specify payrun name and structure." }));
      return;
    }
    if (wizardData.selectedEmployeeIds.length === 0) {
      dispatch(addToast({ type: "error", title: "No Staff Selected", message: "Please select at least 1 employee for this payrun." }));
      return;
    }

    createPayrunMutation.mutate(
      {
        name: wizardData.name,
        periodStart: wizardData.periodStart,
        periodEnd: wizardData.periodEnd,
        salaryStructureId: wizardData.salaryStructureId,
        employeeIds: wizardData.selectedEmployeeIds,
      },
      {
        onSuccess: (res) => {
          const newRun = res?.data;
          dispatch(addToast({ type: "success", title: "Payrun Initialized", message: "Opening payrun processing workstation." }));
          setIsWizardOpen(false);
          if (newRun?.id) {
            navigate(`/payroll/payrun/${newRun.id}`);
          }
        },
        onError: (err) => {
          dispatch(addToast({ type: "error", title: "Creation Failed", message: err.message }));
        },
      }
    );
  };

  const loading = payrunsLoading || payslipsLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payroll Operations & Payruns</h1>
          <p className="text-xs text-slate-500 mt-0.5">Two-step payrun execution, salary rule computations, validation checks, and payslip generation</p>
        </div>

        <button
          onClick={handleOpenWizard}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Payrun Wizard</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-1 flex items-center gap-1 shadow-2xs">
          <button
            onClick={() => setActiveTab("payruns")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === "payruns" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Banknote className="w-4 h-4" />
            <span>Payruns ({payruns.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("payslips")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === "payslips" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>All Generated Payslips ({payslips.length})</span>
          </button>
        </div>

        {activeTab === "payslips" && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPayslipPage(1);
              }}
              placeholder="Search payslips by employee..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
            />
          </div>
        )}
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching payroll batches..." />
      ) : activeTab === "payruns" ? (
        payruns.length === 0 ? (
          <EmptyState
            title="No payruns created yet"
            description="Launch the 2-step setup wizard to configure period scope, select eligible staff, and compute payslips."
            icon={Banknote}
            action={
              <button
                onClick={handleOpenWizard}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                Launch Payrun Wizard
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {payruns.map((run) => (
              <div
                key={run.id}
                onClick={() => navigate(`/payroll/payrun/${run.id}`)}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <Badge variant={run.status}>{run.status}</Badge>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                    {run.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{run.periodStart} → {run.periodEnd}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>{structureMap[run.salaryStructureId]?.name || "Structure"}</span>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Batch Processing</span>
                  <span className="text-indigo-600 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Open Run <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : filteredPayslips.length === 0 ? (
        <EmptyState
          title="No payslips found"
          description="Generated payslips from computed payruns will appear here."
          icon={FileCheck2}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Basic Salary</th>
                  <th className="px-4 py-3">Gross Salary</th>
                  <th className="px-4 py-3">Net Salary</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Warnings</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedPayslips.map((slip) => {
                  const emp = employeeMap[slip.employeeId];
                  return (
                    <tr
                      key={slip.id}
                      onClick={() => navigate(`/payroll/payslip/${slip.id}`)}
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900 block">
                          {emp ? `${emp.firstName} ${emp.lastName}` : `Employee #${slip.employeeId?.slice(0, 8)}`}
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            payrollService.downloadPayslipPdf(slip.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={payslipPage}
            totalItems={filteredPayslips.length}
            pageSize={payslipPageSize}
            pageSizeOptions={[10, 25, 50]}
            onPageChange={setPayslipPage}
            onPageSizeChange={(s) => {
              setPayslipPageSize(s);
              setPayslipPage(1);
            }}
          />
        </div>
      )}

      <Modal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        title={wizardStep === 1 ? "Payrun Wizard (Step 1: Scope & Period)" : "Payrun Wizard (Step 2: Employee Selection)"}
        maxWidth="max-w-2xl"
      >
        {wizardStep === 1 ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Define the salary period and select the salary computation structure.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payrun Batch Name</label>
              <input
                type="text"
                required
                value={wizardData.name}
                onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
                placeholder="e.g. October 2026 Regular Salary"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Period Start</label>
                <input
                  type="date"
                  required
                  value={wizardData.periodStart}
                  onChange={(e) => setWizardData({ ...wizardData, periodStart: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Period End</label>
                <input
                  type="date"
                  required
                  value={wizardData.periodEnd}
                  onChange={(e) => setWizardData({ ...wizardData, periodEnd: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Salary Structure</label>
              <Combobox
                options={structureOptions}
                value={wizardData.salaryStructureId}
                onChange={(val) => setWizardData({ ...wizardData, salaryStructureId: val })}
                placeholder="Search Salary Structure..."
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsWizardOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!wizardData.name || !wizardData.salaryStructureId) {
                    dispatch(addToast({ type: "error", title: "Required Fields", message: "Enter name and structure." }));
                    return;
                  }
                  setWizardStep(2);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
              >
                <span>Continue to Staff Selection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Selected {wizardData.selectedEmployeeIds.length} of {employees.length} Employees
                </p>
                <p className="text-[11px] text-slate-500">
                  Ensure active contract coverage exists for selected period.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSelectAllEmployees}
                className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
              >
                {wizardData.selectedEmployeeIds.length === employees.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
              {employees.map((emp) => {
                const isSelected = wizardData.selectedEmployeeIds.includes(emp.id);
                const hasContract = activeContractEmployeeSet.has(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => handleToggleEmployee(emp.id)}
                    className={`p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors ${isSelected ? "bg-indigo-50/40" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="font-semibold text-xs text-slate-900 block">
                          {emp.firstName} {emp.lastName}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {emp.department} • {emp.designation} • #{emp.employeeId}
                        </span>
                      </div>
                    </div>

                    <div>
                      {hasContract ? (
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Contract Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Missing Contract
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Back
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={createPayrunMutation.isPending}
                  onClick={handleCreatePayrun}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {createPayrunMutation.isPending ? "Initializing Payrun..." : "Create & Open Payrun"}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
