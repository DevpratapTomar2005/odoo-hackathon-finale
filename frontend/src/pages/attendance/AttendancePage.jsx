import React, { useState, useMemo } from "react";
import { useAllAttendance, useAttendanceCorrection, useCreateAttendanceRecord } from "../../hooks/useAttendence.js";
import { useEmployees } from "../../hooks/useEmployee.js";
import { useAllTimeoffRequests } from "../../hooks/useTimeOffAndAllocations.js";
import { Badge } from "../../components/common/Badge.jsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Pagination } from "../../components/common/Pagination.jsx";
import { Combobox } from "../../components/common/Combobox.jsx";
import { useDispatch } from "react-redux";
import { addToast } from "../../store/slices/uiSlice.js";
import {
  CalendarCheck,
  Search,
  Edit3,
  Plus,
  LayoutGrid,
  List,
  Clock,
  UserCheck,
  CalendarOff,
} from "lucide-react";

export function AttendancePage() {
  const { data: attRes, isLoading: attLoading } = useAllAttendance();
  const { data: empRes } = useEmployees();
  const { data: timeoffRes } = useAllTimeoffRequests();

  const correctAttendanceMutation = useAttendanceCorrection();
  const createRecordMutation = useCreateAttendanceRecord();

  const attendanceRecords = attRes?.data || [];
  const employees = empRes?.data || [];
  const timeOffRequests = timeoffRes?.data || [];

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState("list");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [correctionData, setCorrectionData] = useState({
    date: "",
    workedHours: 8,
    overtimeHours: 0,
    status: "PRESENT",
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAttendance, setNewAttendance] = useState({
    employeeId: "",
    date: new Date().toISOString().slice(0, 10),
    workedHours: 8,
    overtimeHours: 0,
    status: "PRESENT",
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

  const approvedLeavesMap = useMemo(() => {
    const map = {};
    timeOffRequests
      .filter((r) => r.status === "APPROVED")
      .forEach((r) => {
        const start = new Date(r.startDate).getTime();
        const end = new Date(r.endDate).getTime();
        if (!map[r.employeeId]) map[r.employeeId] = [];
        map[r.employeeId].push({ start, end, typeName: r.typeName || "Leave" });
      });
    return map;
  }, [timeOffRequests]);

  const enhancedRecords = useMemo(() => {
    return attendanceRecords.map((rec) => {
      const recDate = rec.date ? new Date(rec.date).getTime() : 0;
      const employeeLeaves = approvedLeavesMap[rec.employeeId] || [];
      const isOnLeave = employeeLeaves.some((l) => recDate >= l.start && recDate <= l.end);

      let effectiveStatus = rec.status;
      if (isOnLeave && (!rec.checkIn || rec.status === "ABSENT")) {
        effectiveStatus = "ON_LEAVE";
      }

      return {
        ...rec,
        effectiveStatus,
        isOnLeave,
      };
    });
  }, [attendanceRecords, approvedLeavesMap]);

  const filteredRecords = useMemo(() => {
    return enhancedRecords.filter((rec) => {
      const emp = employeeMap[rec.employeeId] || {
        firstName: rec.firstName,
        lastName: rec.lastName,
        employeeId: rec.employeeCode,
      };
      const name = `${emp.firstName || ""} ${emp.lastName || ""}`.toLowerCase();
      const matchesSearch =
        name.includes(search.toLowerCase()) ||
        String(emp.employeeId || "").includes(search) ||
        rec.date?.includes(search);
      const matchesDate = !dateFilter || rec.date === dateFilter;
      const matchesStatus =
        !statusFilter ||
        rec.status === statusFilter ||
        rec.effectiveStatus === statusFilter;
      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [enhancedRecords, employeeMap, search, dateFilter, statusFilter]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const handleCorrectionSubmit = (e) => {
    e.preventDefault();
    if (!selectedRecord?.id) return;

    correctAttendanceMutation.mutate(
      {
        id: selectedRecord.id,
        data: {
          workedHours: Number(correctionData.workedHours),
          overtimeHours: Number(correctionData.overtimeHours),
          status: correctionData.status,
          date: correctionData.date,
        },
      },
      {
        onSuccess: () => {
          dispatch(addToast({ type: "success", title: "Attendance Corrected", message: "Record updated." }));
          setIsCorrectionModalOpen(false);
        },
        onError: (err) => {
          dispatch(addToast({ type: "error", title: "Correction Failed", message: err.message }));
        },
      }
    );
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newAttendance.employeeId) {
      dispatch(addToast({ type: "error", title: "Missing Field", message: "Please select an employee." }));
      return;
    }

    createRecordMutation.mutate(
      {
        ...newAttendance,
        workedHours: Number(newAttendance.workedHours),
        overtimeHours: Number(newAttendance.overtimeHours),
      },
      {
        onSuccess: () => {
          dispatch(addToast({ type: "success", title: "Attendance Created", message: "New entry added." }));
          setIsAddModalOpen(false);
        },
        onError: (err) => {
          dispatch(addToast({ type: "error", title: "Creation Failed", message: err.message }));
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Daily Attendance Logs</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track worked hours, overtime, leave status, and administrative corrections</p>
        </div>
        <button
          onClick={() => {
            setNewAttendance({
              employeeId: employees[0]?.id || "",
              date: new Date().toISOString().slice(0, 10),
              workedHours: 8,
              overtimeHours: 0,
              status: "PRESENT",
            });
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Manual Entry</span>
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
            placeholder="Search by employee name or ID..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="ON_LEAVE">On Leave</option>
          </select>

          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md cursor-pointer ${viewMode === "list" ? "bg-white text-indigo-600 shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-800"}`}
              title="List Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-md cursor-pointer ${viewMode === "kanban" ? "bg-white text-indigo-600 shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-800"}`}
              title="Kanban Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {attLoading ? (
        <LoadingSpinner text="Fetching attendance logs..." />
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          title="No attendance records found"
          description="Attendance records will populate as staff clock in or when added manually."
          icon={CalendarCheck}
        />
      ) : viewMode === "list" ? (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Check In</th>
                  <th className="px-4 py-3">Check Out</th>
                  <th className="px-4 py-3">Worked Hours</th>
                  <th className="px-4 py-3">Overtime</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Correction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedRecords.map((rec) => {
                  const emp = employeeMap[rec.employeeId] || {
                    firstName: rec.firstName,
                    lastName: rec.lastName,
                    employeeId: rec.employeeCode,
                    department: rec.department,
                  };
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">{rec.date}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900 block">
                          {emp.firstName} {emp.lastName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {emp.department} • #{emp.employeeId}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : (
                          rec.checkIn ? <span className="text-amber-600 font-medium">In Progress</span> : "-"
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{rec.workedHours || 0} hrs</td>
                      <td className="px-4 py-3 font-semibold text-indigo-600">{rec.overtimeHours || 0} hrs</td>
                      <td className="px-4 py-3">
                        {rec.effectiveStatus === "ON_LEAVE" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            <CalendarOff className="w-3 h-3" />
                            <span>On Leave</span>
                          </span>
                        ) : (
                          <Badge variant={rec.status}>{rec.status}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedRecord(rec);
                            setCorrectionData({
                              date: rec.date,
                              workedHours: rec.workedHours || 8,
                              overtimeHours: rec.overtimeHours || 0,
                              status: rec.status,
                            });
                            setIsCorrectionModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit / Correct Record"
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
            totalItems={filteredRecords.length}
            pageSize={pageSize}
            pageSizeOptions={[10, 25, 50, 100]}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedRecords.map((rec) => {
              const emp = employeeMap[rec.employeeId] || {
                firstName: rec.firstName,
                lastName: rec.lastName,
                employeeId: rec.employeeCode,
                department: rec.department,
              };
              return (
                <div
                  key={rec.id}
                  className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-indigo-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {emp.firstName ? emp.firstName[0].toUpperCase() : "E"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs truncate">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <span className="text-[10px] text-slate-400 block">{rec.date}</span>
                        </div>
                      </div>
                      {rec.effectiveStatus === "ON_LEAVE" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          On Leave
                        </span>
                      ) : (
                        <Badge variant={rec.status}>{rec.status}</Badge>
                      )}
                    </div>

                    <div className="space-y-1.5 py-2 text-xs text-slate-600 border-y border-slate-100 my-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Clock In:</span>
                        <span className="font-mono font-medium text-slate-700">
                          {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Clock Out:</span>
                        <span className="font-mono font-medium text-slate-700">
                          {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : (rec.checkIn ? "In Progress" : "-")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Worked:</span>
                        <span className="font-semibold text-slate-900">{rec.workedHours || 0} hrs</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] text-indigo-600 font-medium">Overtime: {rec.overtimeHours || 0}h</span>
                    <button
                      onClick={() => {
                        setSelectedRecord(rec);
                        setCorrectionData({
                          date: rec.date,
                          workedHours: rec.workedHours || 8,
                          overtimeHours: rec.overtimeHours || 0,
                          status: rec.status,
                        });
                        setIsCorrectionModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredRecords.length}
            pageSize={pageSize}
            pageSizeOptions={[8, 12, 24, 48]}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        title="Manual Attendance Correction"
      >
        <form onSubmit={handleCorrectionSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
            <input
              type="date"
              required
              value={correctionData.date}
              onChange={(e) => setCorrectionData({ ...correctionData, date: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Worked Hours</label>
              <input
                type="number"
                step="0.5"
                required
                value={correctionData.workedHours}
                onChange={(e) => setCorrectionData({ ...correctionData, workedHours: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Overtime Hours</label>
              <input
                type="number"
                step="0.5"
                value={correctionData.overtimeHours}
                onChange={(e) => setCorrectionData({ ...correctionData, overtimeHours: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={correctionData.status}
              onChange={(e) => setCorrectionData({ ...correctionData, status: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCorrectionModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={correctAttendanceMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg cursor-pointer disabled:opacity-50"
            >
              {correctAttendanceMutation.isPending ? "Applying..." : "Apply Correction"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Manual Attendance Entry"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Employee</label>
            <Combobox
              options={employeeOptions}
              value={newAttendance.employeeId}
              onChange={(val) => setNewAttendance({ ...newAttendance, employeeId: val })}
              placeholder="Search employee by name or ID..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
            <input
              type="date"
              required
              value={newAttendance.date}
              onChange={(e) => setNewAttendance({ ...newAttendance, date: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Worked Hours</label>
              <input
                type="number"
                step="0.5"
                required
                value={newAttendance.workedHours}
                onChange={(e) => setNewAttendance({ ...newAttendance, workedHours: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Overtime Hours</label>
              <input
                type="number"
                step="0.5"
                value={newAttendance.overtimeHours}
                onChange={(e) => setNewAttendance({ ...newAttendance, overtimeHours: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={newAttendance.status}
              onChange={(e) => setNewAttendance({ ...newAttendance, status: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createRecordMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg cursor-pointer disabled:opacity-50"
            >
              {createRecordMutation.isPending ? "Creating..." : "Create Record"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
