import React, { useState, useMemo } from "react";
import {
  useAllTimeoffRequests,
  useAllAllocations,
  useTimeoffTypes,
  useApproveTimeoff,
  useRejectTimeoff,
  useApproveAllocation,
  useRejectAllocation,
  useCreateTimeoffRequest,
  useCreateAllocation,
  useCreateTimeoffType,
  useEditTimeoffType,
} from "../../hooks/useTimeOffAndAllocations.js";
import { useEmployees } from "../../hooks/useEmployee.js";
import { Badge } from "../../components/common/Badge.jsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Pagination } from "../../components/common/Pagination.jsx";
import { Combobox } from "../../components/common/Combobox.jsx";
import { useDispatch } from "react-redux";
import { addToast } from "../../store/slices/uiSlice.js";
import {
  CalendarOff,
  Layers,
  Settings2,
  Plus,
  Check,
  X,
  LayoutGrid,
  List,
  Search,
  Pencil,
} from "lucide-react";

export function TimeOffPage() {
  const [activeTab, setActiveTab] = useState("requests");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("kanban");

  const [reqPage, setReqPage] = useState(1);
  const [reqPageSize, setReqPageSize] = useState(10);
  const [allocPage, setAllocPage] = useState(1);
  const [allocPageSize, setAllocPageSize] = useState(10);

  const { data: reqRes, isLoading: reqLoading } = useAllTimeoffRequests();
  const { data: allocRes, isLoading: allocLoading } = useAllAllocations();
  const { data: typesRes } = useTimeoffTypes();
  const { data: empRes } = useEmployees();

  const approveTimeoffMutation = useApproveTimeoff();
  const rejectTimeoffMutation = useRejectTimeoff();
  const approveAllocMutation = useApproveAllocation();
  const rejectAllocMutation = useRejectAllocation();
  const createRequestMutation = useCreateTimeoffRequest();
  const createAllocMutation = useCreateAllocation();
  const createTypeMutation = useCreateTimeoffType();
  const editTypeMutation = useEditTimeoffType();

  const requests = reqRes?.data || [];
  const allocations = allocRes?.data || [];
  const types = typesRes?.data || [];
  const employees = empRes?.data || [];

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

  const [requestFormData, setRequestFormData] = useState({
    employeeId: "",
    timeoffType: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    reason: "",
  });

  const [allocFormData, setAllocFormData] = useState({
    employeeId: "",
    timeoffTypeId: "",
    allocatedDays: 15,
    validityYear: new Date().getFullYear(),
  });

  const [typeFormData, setTypeFormData] = useState({
    name: "",
    unit: "DAY",
    allocationNeed: "REQUIRED",
    displayColour: "BLUE",
    status: "ACTIVE",
  });

  const [isEditTypeModalOpen, setIsEditTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [editTypeFormData, setEditTypeFormData] = useState({
    name: "",
    unit: "DAY",
    allocationNeed: "REQUIRED",
    displayColour: "BLUE",
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

  const typeOptions = useMemo(() => {
    return types.map((t) => ({
      value: t.id,
      label: t.name,
      sublabel: `Unit: ${t.unit} • ${t.allocationNeed}`,
    }));
  }, [types]);

  const handleApproveRequest = (id) => {
    approveTimeoffMutation.mutate(id, {
      onSuccess: () => {
        dispatch(addToast({ type: "success", title: "Approved", message: "Time off request approved and balance updated." }));
      },
      onError: (err) => {
        dispatch(addToast({ type: "error", title: "Approval Failed", message: err.message }));
      },
    });
  };

  const handleRejectRequest = (id) => {
    rejectTimeoffMutation.mutate(id, {
      onSuccess: () => {
        dispatch(addToast({ type: "info", title: "Rejected", message: "Time off request refused." }));
      },
      onError: (err) => {
        dispatch(addToast({ type: "error", title: "Action Failed", message: err.message }));
      },
    });
  };

  const handleApproveAlloc = (id) => {
    approveAllocMutation.mutate(id, {
      onSuccess: () => {
        dispatch(addToast({ type: "success", title: "Approved", message: "Allocation activated." }));
      },
      onError: (err) => {
        dispatch(addToast({ type: "error", title: "Approval Failed", message: err.message }));
      },
    });
  };

  const handleRejectAlloc = (id) => {
    rejectAllocMutation.mutate(id, {
      onSuccess: () => {
        dispatch(addToast({ type: "info", title: "Rejected", message: "Allocation rejected." }));
      },
      onError: (err) => {
        dispatch(addToast({ type: "error", title: "Action Failed", message: err.message }));
      },
    });
  };

  const handleCreateRequest = (e) => {
    e.preventDefault();
    if (!requestFormData.employeeId || !requestFormData.timeoffType) {
      dispatch(addToast({ type: "error", title: "Missing Details", message: "Please select both employee and leave type." }));
      return;
    }

    if (!requestFormData.startDate || !requestFormData.endDate) {
      dispatch(addToast({ type: "error", title: "Missing Dates", message: "Please select both a start and end date." }));
      return;
    }

    if (requestFormData.endDate < requestFormData.startDate) {
      dispatch(addToast({ type: "error", title: "Invalid Date Range", message: "End date cannot be before the start date." }));
      return;
    }

    if (!requestFormData.reason.trim()) {
      dispatch(addToast({ type: "error", title: "Missing Reason", message: "Please provide a reason for the leave request." }));
      return;
    }

    createRequestMutation.mutate(
      {
        employeeId: requestFormData.employeeId,
        data: {
          startDate: requestFormData.startDate,
          endDate: requestFormData.endDate,
          timeoffType: requestFormData.timeoffType,
          reason: requestFormData.reason,
        },
      },
      {
        onSuccess: () => {
          dispatch(addToast({ type: "success", title: "Request Submitted", message: "Time off request logged." }));
          setIsRequestModalOpen(false);
        },
        onError: (err) => {
          dispatch(addToast({ type: "error", title: "Submission Failed", message: err.message }));
        },
      }
    );
  };

  const handleCreateAlloc = (e) => {
    e.preventDefault();
    if (!allocFormData.employeeId || !allocFormData.timeoffTypeId) {
      dispatch(addToast({ type: "error", title: "Missing Details", message: "Please select both employee and leave type." }));
      return;
    }

    const allocatedDaysNum = Number(allocFormData.allocatedDays);
    if (allocFormData.allocatedDays === "" || Number.isNaN(allocatedDaysNum) || allocatedDaysNum <= 0) {
      dispatch(addToast({ type: "error", title: "Invalid Allocated Days", message: "Allocated days must be a number greater than 0." }));
      return;
    }

    const allocValidityYearNum = Number(allocFormData.validityYear);
    if (allocFormData.validityYear === "" || !Number.isInteger(allocValidityYearNum) || allocValidityYearNum < 2000 || allocValidityYearNum > 2100) {
      dispatch(addToast({ type: "error", title: "Invalid Validity Year", message: "Please enter a valid 4-digit validity year." }));
      return;
    }

    createAllocMutation.mutate(
      {
        employeeId: allocFormData.employeeId,
        data: {
          timeoffTypeId: allocFormData.timeoffTypeId,
          allocatedDays: Number(allocFormData.allocatedDays),
          validityYear: Number(allocFormData.validityYear),
        },
      },
      {
        onSuccess: () => {
          dispatch(addToast({ type: "success", title: "Allocation Created", message: "Allocation registered." }));
          setIsAllocModalOpen(false);
        },
        onError: (err) => {
          dispatch(addToast({ type: "error", title: "Creation Failed", message: err.message }));
        },
      }
    );
  };

  const handleCreateType = (e) => {
    e.preventDefault();

    if (!typeFormData.name.trim()) {
      dispatch(addToast({ type: "error", title: "Missing Name", message: "Please enter a policy type name." }));
      return;
    }

    createTypeMutation.mutate(typeFormData, {
      onSuccess: () => {
        dispatch(addToast({ type: "success", title: "Type Created", message: "New time off type registered." }));
        setIsTypeModalOpen(false);
      },
      onError: (err) => {
        dispatch(addToast({ type: "error", title: "Creation Failed", message: err.message }));
      },
    });
  };

  const handleEditType = (e) => {
    e.preventDefault();
    if (!editingType?.id) return;

    if (!editTypeFormData.name.trim()) {
      dispatch(addToast({ type: "error", title: "Missing Name", message: "Please enter a policy type name." }));
      return;
    }

    editTypeMutation.mutate(
      { id: editingType.id, data: editTypeFormData },
      {
        onSuccess: () => {
          dispatch(addToast({ type: "success", title: "Policy Updated", message: "Time off policy updated successfully." }));
          setIsEditTypeModalOpen(false);
          setEditingType(null);
        },
        onError: (err) => {
          dispatch(addToast({ type: "error", title: "Update Failed", message: err.message }));
        },
      }
    );
  };

  const openEditType = (t) => {
    setEditingType(t);
    setEditTypeFormData({
      name: t.name,
      unit: t.unit,
      allocationNeed: t.allocationNeed,
      displayColour: t.displayColour,
      status: t.status,
    });
    setIsEditTypeModalOpen(true);
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const emp = employeeMap[r.employeeId] || { firstName: r.firstName, lastName: r.lastName };
      const name = `${emp.firstName || ""} ${emp.lastName || ""}`.toLowerCase();
      return name.includes(search.toLowerCase()) || r.reason?.toLowerCase().includes(search.toLowerCase());
    });
  }, [requests, employeeMap, search]);

  const paginatedRequests = useMemo(() => {
    const start = (reqPage - 1) * reqPageSize;
    return filteredRequests.slice(start, start + reqPageSize);
  }, [filteredRequests, reqPage, reqPageSize]);

  const filteredAllocations = useMemo(() => {
    return allocations.filter((a) => {
      const emp = employeeMap[a.employeeId] || { firstName: a.firstName, lastName: a.lastName };
      const name = `${emp.firstName || ""} ${emp.lastName || ""}`.toLowerCase();
      return name.includes(search.toLowerCase());
    });
  }, [allocations, employeeMap, search]);

  const paginatedAllocations = useMemo(() => {
    const start = (allocPage - 1) * allocPageSize;
    return filteredAllocations.slice(start, start + allocPageSize);
  }, [filteredAllocations, allocPage, allocPageSize]);

  const pendingRequests = useMemo(() => filteredRequests.filter((r) => r.status === "PENDING"), [filteredRequests]);
  const approvedRequests = useMemo(() => filteredRequests.filter((r) => r.status === "APPROVED"), [filteredRequests]);
  const rejectedRequests = useMemo(() => filteredRequests.filter((r) => r.status === "REJECTED"), [filteredRequests]);

  const loading = reqLoading || allocLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Time Off & Leave Allocations</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage leave requests, yearly allocations, balances, and company time off policies</p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "requests" && (
            <button
              onClick={() => {
                setRequestFormData({
                  employeeId: employees[0]?.id || "",
                  timeoffType: types[0]?.id || "",
                  startDate: new Date().toISOString().slice(0, 10),
                  endDate: new Date().toISOString().slice(0, 10),
                  reason: "",
                });
                setIsRequestModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Leave Request</span>
            </button>
          )}

          {activeTab === "allocations" && (
            <button
              onClick={() => {
                setAllocFormData({
                  employeeId: employees[0]?.id || "",
                  timeoffTypeId: types[0]?.id || "",
                  allocatedDays: 15,
                  validityYear: new Date().getFullYear(),
                });
                setIsAllocModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Allocation</span>
            </button>
          )}

          {activeTab === "types" && (
            <button
              onClick={() => {
                setTypeFormData({
                  name: "",
                  unit: "DAY",
                  allocationNeed: "REQUIRED",
                  displayColour: "BLUE",
                  status: "ACTIVE",
                });
                setIsTypeModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Policy Type</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-1 flex items-center gap-1 shadow-2xs">
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === "requests" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <CalendarOff className="w-4 h-4" />
            <span>Requests ({requests.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("allocations")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === "allocations" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Layers className="w-4 h-4" />
            <span>Allocations ({allocations.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("types")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === "types" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Settings2 className="w-4 h-4" />
            <span>Policies ({types.length})</span>
          </button>
        </div>

        {activeTab !== "types" && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by name or reason..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
              />
            </div>

            {activeTab === "requests" && (
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white p-0.5 shadow-2xs">
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`p-1.5 rounded-md cursor-pointer ${viewMode === "kanban" ? "bg-indigo-50 text-indigo-600 font-semibold" : "text-slate-500 hover:text-slate-800"}`}
                  title="Kanban Columns View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md cursor-pointer ${viewMode === "list" ? "bg-indigo-50 text-indigo-600 font-semibold" : "text-slate-500 hover:text-slate-800"}`}
                  title="List Table View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching time off details..." />
      ) : activeTab === "requests" ? (
        filteredRequests.length === 0 ? (
          <EmptyState
            title="No time off requests"
            description="Submit a leave request for approvals and automatic balance consumption."
            icon={CalendarOff}
          />
        ) : viewMode === "kanban" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Pending Review</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  {pendingRequests.length}
                </span>
              </div>

              <div className="space-y-3">
                {pendingRequests.map((r) => {
                  const emp = employeeMap[r.employeeId] || { firstName: r.firstName, lastName: r.lastName };
                  const days = Math.max(
                    1,
                    Math.ceil(
                      (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  );
                  return (
                    <div key={r.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <span className="text-[10px] text-slate-400 block">{r.typeName || "Leave"}</span>
                        </div>
                        <Badge variant={r.displayColour || "BLUE"}>{days} {days === 1 ? "Day" : "Days"}</Badge>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg">
                        {r.reason}
                      </p>

                      <div className="text-[10px] font-mono text-slate-400">
                        {new Date(r.startDate).toLocaleDateString()} → {new Date(r.endDate).toLocaleDateString()}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleRejectRequest(r.id)}
                          disabled={rejectTimeoffMutation.isPending}
                          className="px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer"
                        >
                          Refuse
                        </button>
                        <button
                          onClick={() => handleApproveRequest(r.id)}
                          disabled={approveTimeoffMutation.isPending}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Approved</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {approvedRequests.length}
                </span>
              </div>

              <div className="space-y-3">
                {approvedRequests.map((r) => {
                  const emp = employeeMap[r.employeeId] || { firstName: r.firstName, lastName: r.lastName };
                  const days = Math.max(
                    1,
                    Math.ceil(
                      (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  );
                  return (
                    <div key={r.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <span className="text-[10px] text-slate-400 block">{r.typeName || "Leave"}</span>
                        </div>
                        <Badge variant="success">{days} Days</Badge>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{r.reason}</p>
                      <div className="text-[10px] font-mono text-slate-400">
                        {new Date(r.startDate).toLocaleDateString()} → {new Date(r.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Refused</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                  {rejectedRequests.length}
                </span>
              </div>

              <div className="space-y-3">
                {rejectedRequests.map((r) => {
                  const emp = employeeMap[r.employeeId] || { firstName: r.firstName, lastName: r.lastName };
                  return (
                    <div key={r.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <span className="text-[10px] text-slate-400 block">{r.typeName || "Leave"}</span>
                        </div>
                        <Badge variant="danger">Refused</Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{r.reason}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Leave Type</th>
                    <th className="px-4 py-3">Duration & Dates</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Approval Workflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedRequests.map((r) => {
                    const emp = employeeMap[r.employeeId] || {
                      firstName: r.firstName,
                      lastName: r.lastName,
                      department: r.department,
                      employeeId: r.employeeCode,
                    };
                    const days = Math.max(
                      1,
                      Math.ceil(
                        (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    );
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-900 block">
                            {emp.firstName} {emp.lastName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {emp.department} • #{emp.employeeId}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={r.displayColour || "BLUE"}>{r.typeName || "Leave"}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-800 block">
                            {days} {days === 1 ? "Day" : "Days"}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {new Date(r.startDate).toLocaleDateString()} → {new Date(r.endDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{r.reason}</td>
                        <td className="px-4 py-3">
                          <Badge variant={r.status}>{r.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {r.status === "PENDING" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleApproveRequest(r.id)}
                                disabled={approveTimeoffMutation.isPending}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleRejectRequest(r.id)}
                                disabled={rejectTimeoffMutation.isPending}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Refuse</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">Processed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={reqPage}
              totalItems={filteredRequests.length}
              pageSize={reqPageSize}
              pageSizeOptions={[10, 25, 50]}
              onPageChange={setReqPage}
              onPageSizeChange={(s) => {
                setReqPageSize(s);
                setReqPage(1);
              }}
            />
          </div>
        )
      ) : activeTab === "allocations" ? (
        filteredAllocations.length === 0 ? (
          <EmptyState
            title="No allocations configured"
            description="Assign leave day allocations to employees to grant available balances."
            icon={Layers}
          />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Leave Type</th>
                    <th className="px-4 py-3">Allocated Days</th>
                    <th className="px-4 py-3">Taken Days</th>
                    <th className="px-4 py-3">Remaining Balance</th>
                    <th className="px-4 py-3">Validity Year</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedAllocations.map((a) => {
                    const emp = employeeMap[a.employeeId] || {
                      firstName: a.firstName,
                      lastName: a.lastName,
                      department: a.department,
                      employeeId: a.employeeCode,
                    };
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-900 block">
                            {emp.firstName} {emp.lastName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {emp.department} • #{emp.employeeId}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{a.typeName || "Policy"}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{a.allocatedDays} Days</td>
                        <td className="px-4 py-3 text-slate-600">{a.takenDays} Days</td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {a.remainingDays} Days
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500">{a.validityYear}</td>
                        <td className="px-4 py-3">
                          <Badge variant={a.status}>{a.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {a.status === "PENDING" && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleApproveAlloc(a.id)}
                                disabled={approveAllocMutation.isPending}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleRejectAlloc(a.id)}
                                disabled={rejectAllocMutation.isPending}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={allocPage}
              totalItems={filteredAllocations.length}
              pageSize={allocPageSize}
              pageSizeOptions={[10, 25, 50]}
              onPageChange={setAllocPage}
              onPageSizeChange={(s) => {
                setAllocPageSize(s);
                setAllocPage(1);
              }}
            />
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map((t) => (
            <div key={t.id} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-slate-900 text-sm">{t.name}</h3>
                <div className="flex items-center gap-1.5">
                  <Badge variant={t.displayColour || "BLUE"}>{t.displayColour || "BLUE"}</Badge>
                  <button
                    onClick={() => openEditType(t)}
                    className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                    title="Edit Policy"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <p className="flex justify-between">
                  <span className="text-slate-400">Unit:</span>
                  <span className="font-semibold text-slate-800">{t.unit}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-400">Allocation Required:</span>
                  <span className="font-semibold text-slate-800">{t.allocationNeed}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <Badge variant={t.status}>{t.status}</Badge>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Submit Time Off Request"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Employee</label>
            <Combobox
              options={employeeOptions}
              value={requestFormData.employeeId}
              onChange={(val) => setRequestFormData({ ...requestFormData, employeeId: val })}
              placeholder="Search Employee..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Time Off Type</label>
            <Combobox
              options={typeOptions}
              value={requestFormData.timeoffType}
              onChange={(val) => setRequestFormData({ ...requestFormData, timeoffType: val })}
              placeholder="Select Policy Type..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={requestFormData.startDate}
                onChange={(e) => setRequestFormData({ ...requestFormData, startDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={requestFormData.endDate}
                onChange={(e) => setRequestFormData({ ...requestFormData, endDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Notes</label>
            <textarea
              required
              rows={3}
              value={requestFormData.reason}
              onChange={(e) => setRequestFormData({ ...requestFormData, reason: e.target.value })}
              placeholder="Provide reason for the time off request..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createRequestMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg cursor-pointer disabled:opacity-50"
            >
              {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isAllocModalOpen}
        onClose={() => setIsAllocModalOpen(false)}
        title="Create Leave Allocation"
      >
        <form onSubmit={handleCreateAlloc} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Employee</label>
            <Combobox
              options={employeeOptions}
              value={allocFormData.employeeId}
              onChange={(val) => setAllocFormData({ ...allocFormData, employeeId: val })}
              placeholder="Search Employee..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Type</label>
            <Combobox
              options={typeOptions}
              value={allocFormData.timeoffTypeId}
              onChange={(val) => setAllocFormData({ ...allocFormData, timeoffTypeId: val })}
              placeholder="Select Policy Type..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Allocated Days</label>
              <input
                type="number"
                required
                min="1"
                value={allocFormData.allocatedDays}
                onChange={(e) => setAllocFormData({ ...allocFormData, allocatedDays: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Validity Year</label>
              <input
                type="number"
                required
                value={allocFormData.validityYear}
                onChange={(e) => setAllocFormData({ ...allocFormData, validityYear: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAllocModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createAllocMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg cursor-pointer disabled:opacity-50"
            >
              {createAllocMutation.isPending ? "Creating..." : "Create Allocation"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        title="Create Time Off Policy Type"
      >
        <form onSubmit={handleCreateType} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Policy Type Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Parental Leave, Casual Leave"
              value={typeFormData.name}
              onChange={(e) => setTypeFormData({ ...typeFormData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
              <select
                value={typeFormData.unit}
                onChange={(e) => setTypeFormData({ ...typeFormData, unit: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="DAY">Days</option>
                <option value="HOUR">Hours</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Allocation Required</label>
              <select
                value={typeFormData.allocationNeed}
                onChange={(e) => setTypeFormData({ ...typeFormData, allocationNeed: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="REQUIRED">Required</option>
                <option value="NOT_REQUIRED">Not Required</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Display Colour Tag</label>
              <select
                value={typeFormData.displayColour}
                onChange={(e) => setTypeFormData({ ...typeFormData, displayColour: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="BLUE">Blue</option>
                <option value="GREEN">Green</option>
                <option value="RED">Red</option>
                <option value="ORANGE">Orange</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={typeFormData.status}
                onChange={(e) => setTypeFormData({ ...typeFormData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsTypeModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTypeMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg cursor-pointer disabled:opacity-50"
            >
              {createTypeMutation.isPending ? "Creating..." : "Create Type"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Policy Type Modal */}
      <Modal
        isOpen={isEditTypeModalOpen}
        onClose={() => { setIsEditTypeModalOpen(false); setEditingType(null); }}
        title={`Edit Policy: ${editingType?.name || ""}`}
      >
        <form onSubmit={handleEditType} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Policy Type Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Parental Leave, Casual Leave"
              value={editTypeFormData.name}
              onChange={(e) => setEditTypeFormData({ ...editTypeFormData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
              <select
                value={editTypeFormData.unit}
                onChange={(e) => setEditTypeFormData({ ...editTypeFormData, unit: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="DAY">Days</option>
                <option value="HOUR">Hours</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Allocation Required</label>
              <select
                value={editTypeFormData.allocationNeed}
                onChange={(e) => setEditTypeFormData({ ...editTypeFormData, allocationNeed: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="REQUIRED">Required</option>
                <option value="NOT_REQUIRED">Not Required</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Display Colour Tag</label>
              <select
                value={editTypeFormData.displayColour}
                onChange={(e) => setEditTypeFormData({ ...editTypeFormData, displayColour: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="BLUE">Blue</option>
                <option value="GREEN">Green</option>
                <option value="RED">Red</option>
                <option value="ORANGE">Orange</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={editTypeFormData.status}
                onChange={(e) => setEditTypeFormData({ ...editTypeFormData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setIsEditTypeModalOpen(false); setEditingType(null); }}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editTypeMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg cursor-pointer disabled:opacity-50"
            >
              {editTypeMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}