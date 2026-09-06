import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  useSalaryStructures,
  useSalaryRulesByStructure,
  useCreateSalaryStructure,
  useCreateSalaryRule,
} from "../../hooks/usePayroll.js";
import { Badge } from "../../components/common/Badge.jsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { addToast } from "../../store/slices/uiSlice.js";
import { Sliders, Plus, ArrowRight, Lock } from "lucide-react";

export function SalaryStructuresPage() {
  const { user } = useSelector((state) => state.auth);
  const isPayrollAdmin = ["ADMIN", "PAYROLL_ADMIN"].includes(user?.role);

  const { data: structuresRes, isLoading: structuresLoading } = useSalaryStructures();
  const structures = structuresRes?.data || [];

  const [selectedStructureState, setSelectedStructureState] = useState(null);
  const selectedStructure = selectedStructureState || structures[0] || null;

  const { data: rulesRes } = useSalaryRulesByStructure(selectedStructure?.id);
  const rules = rulesRes?.data || [];

  const createStructureMutation = useCreateSalaryStructure();
  const createRuleMutation = useCreateSalaryRule();

  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [structureName, setStructureName] = useState("");

  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleFormData, setRuleFormData] = useState({
    name: "",
    code: "",
    category: "ALLOWANCE",
    sequence: 20,
    computationMethod: "PERCENTAGE",
    amount: 0,
    percentage: 20,
    percentageBaseCode: "BASIC",
    formula: "",
  });

  const dispatch = useDispatch();

  const handleCreateStructure = (e) => {
    e.preventDefault();
    if (!isPayrollAdmin) {
      dispatch(addToast({ type: "error", title: "Access Denied", message: "Only Payroll Managers can modify salary structures." }));
      return;
    }

    if (!structureName.trim()) {
      dispatch(addToast({ type: "error", title: "Missing Name", message: "Please enter a structure name." }));
      return;
    }

    createStructureMutation.mutate(
      { name: structureName, status: "ACTIVE" },
      {
        onSuccess: (res) => {
          dispatch(addToast({ type: "success", title: "Structure Created", message: "New structure active." }));
          setIsStructureModalOpen(false);
          setStructureName("");
          if (res?.data) setSelectedStructureState(res.data);
        },
        onError: (err) => {
          dispatch(addToast({ type: "error", title: "Creation Failed", message: err.message }));
        },
      }
    );
  };

  const handleCreateRule = (e) => {
    e.preventDefault();
    if (!selectedStructure?.id) return;
    if (!isPayrollAdmin) {
      dispatch(addToast({ type: "error", title: "Access Denied", message: "Only Payroll Managers can modify salary rules." }));
      return;
    }

    if (!ruleFormData.name.trim()) {
      dispatch(addToast({ type: "error", title: "Missing Name", message: "Please enter a rule name." }));
      return;
    }

    if (!ruleFormData.code.trim()) {
      dispatch(addToast({ type: "error", title: "Missing Code", message: "Please enter a rule code." }));
      return;
    }

    const sequenceNum = Number(ruleFormData.sequence);
    if (ruleFormData.sequence === "" || !Number.isInteger(sequenceNum) || sequenceNum <= 0) {
      dispatch(addToast({ type: "error", title: "Invalid Sequence", message: "Execution sequence must be a positive whole number." }));
      return;
    }

    if (ruleFormData.computationMethod === "FIXED") {
      const amountNum = Number(ruleFormData.amount);
      if (ruleFormData.amount === "" || Number.isNaN(amountNum) || amountNum < 0) {
        dispatch(addToast({ type: "error", title: "Invalid Amount", message: "Fixed amount must be a number of 0 or more." }));
        return;
      }
    } else if (ruleFormData.computationMethod === "PERCENTAGE") {
      const percentageNum = Number(ruleFormData.percentage);
      if (ruleFormData.percentage === "" || Number.isNaN(percentageNum) || percentageNum <= 0 || percentageNum > 100) {
        dispatch(addToast({ type: "error", title: "Invalid Percentage", message: "Percentage must be a number between 0 and 100." }));
        return;
      }
      if (!ruleFormData.percentageBaseCode.trim()) {
        dispatch(addToast({ type: "error", title: "Missing Base Code", message: "Please enter a base rule code." }));
        return;
      }
    } else if (ruleFormData.computationMethod === "FORMULA") {
      if (!ruleFormData.formula.trim()) {
        dispatch(addToast({ type: "error", title: "Missing Formula", message: "Please enter a formula expression." }));
        return;
      }
    }

    const payload = {
      name: ruleFormData.name,
      code: ruleFormData.code.toUpperCase(),
      category: ruleFormData.category,
      sequence: Number(ruleFormData.sequence),
      computationMethod: ruleFormData.computationMethod,
    };

    if (ruleFormData.computationMethod === "FIXED") {
      payload.amount = Number(ruleFormData.amount);
    } else if (ruleFormData.computationMethod === "PERCENTAGE") {
      payload.percentage = Number(ruleFormData.percentage);
      payload.percentageBaseCode = ruleFormData.percentageBaseCode.toUpperCase();
    } else if (ruleFormData.computationMethod === "FORMULA") {
      payload.formula = ruleFormData.formula;
    }

    createRuleMutation.mutate(
      { structureId: selectedStructure.id, data: payload },
      {
        onSuccess: () => {
          dispatch(addToast({ type: "success", title: "Rule Created", message: "Rule added to sequence." }));
          setIsRuleModalOpen(false);
        },
        onError: (err) => {
          dispatch(addToast({ type: "error", title: "Rule Failed", message: err.message }));
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Salary Structures & Rules Configuration</h1>
          <p className="text-xs text-slate-500 mt-0.5">Define structured salary computation frameworks, sequenced formula rules, and deductions</p>
        </div>

        {isPayrollAdmin ? (
          <button
            onClick={() => setIsStructureModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Salary Structure</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs border border-slate-200">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Read-Only Mode (Payroll User)</span>
          </div>
        )}
      </div>

      {structuresLoading ? (
        <LoadingSpinner text="Fetching salary structures..." />
      ) : structures.length === 0 ? (
        <EmptyState
          title="No salary structures found"
          description="Create a structure and configure salary rules (Basic, HRA, PF, Bonuses) to compute payslips."
          icon={Sliders}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Structures</h3>
            {structures.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedStructureState(s)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedStructure?.id === s.id ? "border-indigo-600 bg-indigo-50/50 shadow-xs" : "border-slate-200 bg-white hover:border-slate-300"}`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                  <Badge variant={s.status}>{s.status}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                  <span>Sequenced Rules</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
                </p>
              </div>
            ))}
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedStructure?.name}</h3>
                  <p className="text-xs text-slate-500">Ordered execution rules for this structure</p>
                </div>

                {isPayrollAdmin && (
                  <button
                    onClick={() => {
                      setRuleFormData({
                        name: "",
                        code: "",
                        category: "ALLOWANCE",
                        sequence: (rules.length + 1) * 10,
                        computationMethod: "PERCENTAGE",
                        amount: 0,
                        percentage: 20,
                        percentageBaseCode: "BASIC",
                        formula: "",
                      });
                      setIsRuleModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Salary Rule</span>
                  </button>
                )}
              </div>

              <div className="pt-4">
                {rules.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                    No salary rules configured. Add rules to define earnings, allowances, and deductions.
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
                          <th className="px-4 py-3">Computation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {rules
                          .slice()
                          .sort((a, b) => a.sequence - b.sequence)
                          .map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50/70">
                              <td className="px-4 py-3 font-mono font-bold text-slate-400">{r.sequence}</td>
                              <td className="px-4 py-3 font-semibold text-slate-900">{r.name}</td>
                              <td className="px-4 py-3 font-mono font-bold text-indigo-600">{r.code}</td>
                              <td className="px-4 py-3">
                                <Badge variant={r.category === "DEDUCTION" ? "danger" : r.category === "BASIC" ? "primary" : "success"}>
                                  {r.category}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                                {r.computationMethod === "FIXED" && `Fixed ₹${Number(r.amount || 0).toLocaleString()}`}
                                {r.computationMethod === "PERCENTAGE" && `${r.percentage}% of ${r.percentageBaseCode}`}
                                {r.computationMethod === "FORMULA" && `Formula: ${r.formula}`}
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
        </div>
      )}

      {isPayrollAdmin && (
        <>
          <Modal
            isOpen={isStructureModalOpen}
            onClose={() => setIsStructureModalOpen(false)}
            title="Create Salary Structure"
          >
            <form onSubmit={handleCreateStructure} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Structure Name</label>
                <input
                  type="text"
                  required
                  value={structureName}
                  onChange={(e) => setStructureName(e.target.value)}
                  placeholder="e.g. Regular Staff Salary Structure"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStructureModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createStructureMutation.isPending}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {createStructureMutation.isPending ? "Creating..." : "Create Structure"}
                </button>
              </div>
            </form>
          </Modal>

          <Modal
            isOpen={isRuleModalOpen}
            onClose={() => setIsRuleModalOpen(false)}
            title="Add Sequenced Salary Rule"
          >
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rule Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. House Rent Allowance"
                    value={ruleFormData.name}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rule Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HRA, BASIC, PF"
                    value={ruleFormData.code}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={ruleFormData.category}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="BASIC">Basic</option>
                    <option value="ALLOWANCE">Allowance</option>
                    <option value="DEDUCTION">Deduction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Execution Sequence</label>
                  <input
                    type="number"
                    required
                    value={ruleFormData.sequence}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, sequence: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Computation Method</label>
                <select
                  value={ruleFormData.computationMethod}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, computationMethod: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="PERCENTAGE">Percentage (%) of Base Rule</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                  <option value="FORMULA">Dynamic Formula Expression</option>
                </select>
              </div>

              {ruleFormData.computationMethod === "FIXED" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fixed Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={ruleFormData.amount}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}

              {ruleFormData.computationMethod === "PERCENTAGE" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Percentage (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={ruleFormData.percentage}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, percentage: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Base Rule Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BASIC"
                      value={ruleFormData.percentageBaseCode}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, percentageBaseCode: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase font-mono"
                    />
                  </div>
                </div>
              )}

              {ruleFormData.computationMethod === "FORMULA" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Formula Expression</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BASIC * 0.10 + 500"
                    value={ruleFormData.formula}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, formula: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Supports arithmetic (+, -, *, /), previous rule codes (BASIC, HRA), and GROSS / DEDUCTIONS.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRuleMutation.isPending}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {createRuleMutation.isPending ? "Adding..." : "Add Rule"}
                </button>
              </div>
            </form>
          </Modal>
        </>
      )}
    </div>
  );
}