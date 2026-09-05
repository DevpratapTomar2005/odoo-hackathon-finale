import React, { useState, useMemo } from "react";
import { useContracts, useCreateContract, useUpdateContract } from "../../hooks/useContract.js";
import { useEmployees } from "../../hooks/useEmployee.js";
import { Badge } from "../../components/common/Badge.jsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Pagination } from "../../components/common/Pagination.jsx";
import { Combobox } from "../../components/common/Combobox.jsx";
import { useDispatch } from "react-redux";
import { addToast } from "../../store/slices/uiSlice.js";
import { FileText, Plus, Search, Edit3, LayoutGrid, List, IndianRupee } from "lucide-react";

export function ContractsPage() {
  const { data: contractsRes, isLoading: contractsLoading } = useContracts();
  const { data: empRes } = useEmployees();

  const createContractMutation = useCreateContract();
  const updateContractMutation = useUpdateContract();

  const contracts = contractsRes?.data || [];
  const employees = empRes?.data || [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formData, setFormData] = useState({
    employeeId: "",
    name: "Standard Employment Contract",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    salary: 50000,
    validity: 2027,
    status: "ACTIVE",
  });

  const dispatch = useDispatch();
  const employeeMap = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees]);

  const employeeOptions = useMemo(() => {
    return employees.map((emp) => ({
      value: emp.id,
      label: `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || `Employee #${emp.employeeId}`,
      sublabel: `${emp.department || "General"} • #${emp.employeeId}`,
    }));
  }, [employees]);

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const emp = employeeMap[c.employeeId];
      const empName = emp ? `${emp.firstName || ""} ${emp.lastName || ""}`.toLowerCase() : "";
      const matchesSearch =
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        empName.includes(search.toLowerCase()) ||
        String(c.salary).includes(search);
      const matchesStatus = !statusFilter || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [contracts, employeeMap, search, statusFilter]);

  const paginatedContracts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredContracts.slice(start, start + pageSize);
  }, [filteredContracts, currentPage, pageSize]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.employeeId && !editingContract) {
      dispatch(addToast({ type: "error", title: "Missing Field", message: "Please select an employee." }));
      return;
    }

    if (editingContract) {
      updateContractMutation.mutate(
        {
          id: editingContract.id,
          data: {
            name: formData.name,
            startDate: formData.startDate,
            endDate: formData.endDate || null,
            salary: Number(formData.salary),
            validity: Number(formData.validity),
            status: formData.status,
          },
        },
        {
          onSuccess: () => {
            dispatch(addToast({ type: "success", title: "Contract Updated", message: "Changes saved." }));
            setIsModalOpen(false);
            setEditingContract(null);
          },
          onError: (err) => {
            dispatch(addToast({ type: "error", title: "Action Failed", message: err.message }));
          },
        }
      );
    } else {
      createContractMutation.mutate(
        {
          ...formData,
          salary: Number(formData.salary),
          validity: Number(formData.validity),
          endDate: formData.endDate || null,
        },
        {
          onSuccess: () => {
            dispatch(addToast({ type: "success", title: "Contract Created", message: "New contract active." }));
            setIsModalOpen(false);
            setEditingContract(null);
          },
          onError: (err) => {
            dispatch(addToast({ type: "error", title: "Action Failed", message: err.message }));
          },
        }
      );
    }
  };

  const handleEdit = (contract) => {
    setEditingContract(contract);
    setFormData({
      employeeId: contract.employeeId,
      name: contract.name,
      startDate: contract.startDate,
      endDate: contract.endDate || "",
      salary: contract.salary,
      validity: contract.validity,
      status: contract.status,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Contract Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Historical and active employee contracts determining period-specific payroll calculation</p>
        </div>
        <button
          onClick={() => {
            setEditingContract(null);
            setFormData({
              employeeId: employees[0]?.id || "",
              name: "Standard Employment Contract",
              startDate: new Date().toISOString().slice(0, 10),
              endDate: "",
              salary: 50000,
              validity: 2027,
              status: "ACTIVE",
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Contract</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by contract title, employee name, or wage..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md cursor-pointer ${viewMode === "list" ? "bg-white text-indigo-600 shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-800"}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-md cursor-pointer ${viewMode === "kanban" ? "bg-white text-indigo-600 shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-800"}`}
              title="Kanban View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {contractsLoading ? (
        <LoadingSpinner text="Loading contracts directory..." />
      ) : filteredContracts.length === 0 ? (
        <EmptyState
          title="No contracts found"
          description="Create employee contracts to set wage terms and enable automated payrun computation."
          icon={FileText}
          action={
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            >
              Add Contract
            </button>
          }
        />
      ) : viewMode === "list" ? (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Contract Title</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Start Date</th>
                  <th className="px-4 py-3">End Date</th>
                  <th className="px-4 py-3">Monthly Base Salary</th>
                  <th className="px-4 py-3">Validity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedContracts.map((c) => {
                  const emp = employeeMap[c.employeeId];
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{c.name}</td>
                      <td className="px-4 py-3">
                        {emp ? (
                          <div>
                            <span className="font-semibold text-slate-800">
                              {emp.firstName} {emp.lastName}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {emp.department} • #{emp.employeeId}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Employee #{c.employeeId?.slice(0, 8)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{c.startDate}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{c.endDate || "Indefinite"}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        ₹{Number(c.salary).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{c.validity}</td>
                      <td className="px-4 py-3">
                        <Badge variant={c.status}>{c.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleEdit(c)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredContracts.length}
            pageSize={pageSize}
            pageSizeOptions={[10, 25, 50]}
            onPageChange={setCurrentPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(1);
            }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedContracts.map((c) => {
              const emp = employeeMap[c.employeeId];
              return (
                <div
                  key={c.id}
                  className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-indigo-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-100">
                        <FileText className="w-4 h-4" />
                      </div>
                      <Badge variant={c.status}>{c.status}</Badge>
                    </div>

                    <h3 className="font-bold text-slate-900 text-xs line-clamp-1">{c.name}</h3>

                    {emp ? (
                      <p className="text-[11px] text-slate-500 mt-1">
                        {emp.firstName} {emp.lastName} ({emp.department})
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1">#{c.employeeId?.slice(0, 8)}</p>
                    )}

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 my-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Monthly Base Salary</span>
                      <span className="text-base font-bold text-slate-900">
                        ₹{Number(c.salary).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Period:</span>
                        <span className="font-mono">{c.startDate} → {c.endDate || "Indefinite"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Validity Year:</span>
                        <span className="font-semibold">{c.validity}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => handleEdit(c)}
                      className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Contract</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredContracts.length}
            pageSize={pageSize}
            pageSizeOptions={[8, 12, 24]}
            onPageChange={setCurrentPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingContract ? "Edit Employment Contract" : "Create New Contract"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingContract && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Employee</label>
              <Combobox
                options={employeeOptions}
                value={formData.employeeId}
                onChange={(val) => setFormData({ ...formData, employeeId: val })}
                placeholder="Search employee..."
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Title</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date (Optional)</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Base Salary (₹)</label>
              <input
                type="number"
                required
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="e.g. 50000"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Validity Year</label>
              <input
                type="number"
                required
                value={formData.validity}
                onChange={(e) => setFormData({ ...formData, validity: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createContractMutation.isPending || updateContractMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg cursor-pointer disabled:opacity-50"
            >
              {editingContract ? "Save Changes" : "Create Contract"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}