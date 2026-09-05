import React, { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { useEmployee, useEmployeeHubStats, useUpdateEmployee } from "../../hooks/useEmployee.js";
import { useWeeklySchedules } from "../../hooks/useSchedules.js";
import { useContracts, useCreateContract } from "../../hooks/useContract.js";
import { useAttendanceByEmployee } from "../../hooks/useAttendence.js";
import { useTimeoffRequestsByEmployee, useAllocationsByEmployee } from "../../hooks/useTimeOffAndAllocations.js";
import { Badge } from "../../components/common/Badge.jsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Combobox } from "../../components/common/Combobox.jsx";
import { addToast } from "../../store/slices/uiSlice.js";
import { toTitleCase, fullName } from "../../utils/format.js";
import {
  ArrowLeft,
  FileText,
  CalendarCheck,
  CalendarOff,
  Layers,
  Save,
  Building2,
  Briefcase,
  Clock,
  Plus,
  Edit2,
  X,
} from "lucide-react";

export function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: empRes, isLoading: empLoading } = useEmployee(id);
  const { data: statsRes } = useEmployeeHubStats(id);
  const { data: schedRes } = useWeeklySchedules();
  const { data: contractsRes } = useContracts();
  const { data: attRes } = useAttendanceByEmployee(id);
  const { data: timeoffRes } = useTimeoffRequestsByEmployee(id);
  const { data: allocRes } = useAllocationsByEmployee(id);

  const updateEmployeeMutation = useUpdateEmployee();
  const createContractMutation = useCreateContract();

  const employeeData = empRes?.data;
  const hubStats = statsRes?.data || { contracts: 0, attendance: 0, timeOff: 0, allocations: 0 };
  const schedules = schedRes?.data?.schedules || [];
  const contractsList = (contractsRes?.data || []).filter((c) => c.employeeId === id);
  const attendanceList = attRes?.data || [];
  const timeOffList = timeoffRes?.data || [];
  const allocationsList = allocRes?.data || [];

  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);

  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [newContractData, setNewContractData] = useState({
    name: "Full-Time Employment Agreement",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    salary: 5000000,
    validity: 2027,
    status: "ACTIVE",
  });

  const departmentOptions = [
    { value: "Engineering", label: "Engineering" },
    { value: "Sales", label: "Sales" },
    { value: "Marketing", label: "Marketing" },
    { value: "HR", label: "HR" },
    { value: "Support", label: "Support" },
    { value: "Finance", label: "Finance" },
  ];

  const scheduleOptions = [
    { value: "", label: "No Schedule Assigned" },
    ...schedules.map((s) => ({
      value: s.id,
      label: s.name,
      sublabel: `${s.totalWorkingHours || 40}h/week`,
    })),
  ];

  const currentForm = formData || (employeeData ? {
    department: employeeData.department || "Engineering",
    designation: employeeData.designation || "Staff",
    status: employeeData.status || "ACTIVE",
    workingWeeklyScheduleId: employeeData.workingWeeklyScheduleId || "",
  } : null);

  const assignedSchedule = schedules.find((s) => s.id === (employeeData?.workingWeeklyScheduleId || currentForm?.workingWeeklyScheduleId));

  const handleUpdateEmployee = (e) => {
    e.preventDefault();
    if (!currentForm) return;

    const updatePayload = {
      department: currentForm.department,
      designation: currentForm.designation,
      status: currentForm.status,
    };
    if (currentForm.workingWeeklyScheduleId) {
      updatePayload.workingWeeklyScheduleId = currentForm.workingWeeklyScheduleId;
    }

    updateEmployeeMutation.mutate(
      {
        id,
        data: updatePayload,
      },
      {
        onSuccess: () => {
          dispatch(addToast({ type: "success", title: "Updated", message: "Employee details saved successfully." }));
          setIsEditing(false);
        },
        onError: (err) => {
          dispatch(addToast({ type: "error", title: "Update Failed", message: err.message }));
        },
      }
    );
  };

  const handleCreateContract = (e) => {
    e.preventDefault();
    createContractMutation.mutate(
      {
        ...newContractData,
        salary: Number(newContractData.salary),
        validity: Number(newContractData.validity),
        employeeId: id,
        endDate: newContractData.endDate || null,
      },
      {
        onSuccess: () => {
          dispatch(addToast({ type: "success", title: "Contract Created", message: "Contract linked to employee." }));
          setIsContractModalOpen(false);
        },
        onError: (err) => {
          dispatch(addToast({ type: "error", title: "Failed", message: err.message }));
        },
      }
    );
  };

  if (empLoading || !employeeData) {
    return <LoadingSpinner text="Loading employee hub profile..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/employees")}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </button>

        <div className="flex items-center gap-2">
          <Badge variant={employeeData.status}>{employeeData.status}</Badge>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold flex items-center justify-center text-2xl shadow-md shadow-indigo-500/20">
              {employeeData.department ? employeeData.department[0] : "E"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {toTitleCase(employeeData.department)} Team Member
                </h1>
                <span className="font-mono text-xs text-slate-400">#{employeeData.employeeId}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {toTitleCase(employeeData.designation)}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {toTitleCase(employeeData.department)}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setActiveTab("contracts")}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${activeTab === "contracts" ? "border-indigo-600 bg-indigo-50/50" : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"}`}
            >
              <div className="flex items-center justify-center gap-1.5 text-indigo-600 font-bold text-base">
                <FileText className="w-4 h-4" />
                <span>{hubStats.contracts || contractsList.length}</span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5 block">
                Contracts
              </span>
            </button>

            <button
              onClick={() => setActiveTab("attendance")}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${activeTab === "attendance" ? "border-indigo-600 bg-indigo-50/50" : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"}`}
            >
              <div className="flex items-center justify-center gap-1.5 text-emerald-600 font-bold text-base">
                <CalendarCheck className="w-4 h-4" />
                <span>{hubStats.attendance || attendanceList.length}</span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5 block">
                Attendance
              </span>
            </button>

            <button
              onClick={() => setActiveTab("timeoff")}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${activeTab === "timeoff" ? "border-indigo-600 bg-indigo-50/50" : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"}`}
            >
              <div className="flex items-center justify-center gap-1.5 text-amber-600 font-bold text-base">
                <CalendarOff className="w-4 h-4" />
                <span>{hubStats.timeOff || timeOffList.length}</span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5 block">
                Time Off
              </span>
            </button>

            <button
              onClick={() => setActiveTab("timeoff")}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${activeTab === "allocations" ? "border-indigo-600 bg-indigo-50/50" : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"}`}
            >
              <div className="flex items-center justify-center gap-1.5 text-purple-600 font-bold text-base">
                <Layers className="w-4 h-4" />
                <span>{hubStats.allocations || allocationsList.length}</span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5 block">
                Allocations
              </span>
            </button>
          </div>
        </div>

        <div className="flex border-b border-slate-200 mt-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${activeTab === "overview" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            Work & Schedule Form
          </button>
          <button
            onClick={() => setActiveTab("contracts")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${activeTab === "contracts" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            Contracts ({contractsList.length})
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${activeTab === "attendance" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            Attendance Logs ({attendanceList.length})
          </button>
          <button
            onClick={() => setActiveTab("timeoff")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${activeTab === "timeoff" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            Time Off & Allocations
          </button>
        </div>

        <div className="pt-6">
          {activeTab === "overview" && currentForm && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isEditing ? "Editing Employee Form" : "Employee Master Record"}
                </span>

                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        department: employeeData.department || "Engineering",
                        designation: employeeData.designation || "Staff",
                        status: employeeData.status || "ACTIVE",
                        workingWeeklyScheduleId: employeeData.workingWeeklyScheduleId || "",
                      });
                      setIsEditing(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Form</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(null);
                        setIsEditing(false);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdateEmployee}
                      disabled={updateEmployeeMutation.isPending}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{updateEmployeeMutation.isPending ? "Saving..." : "Save Changes"}</span>
                    </button>
                  </div>
                )}
              </div>

              {!isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-200">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Department</span>
                      <p className="text-sm font-semibold text-slate-900 mt-1">{employeeData.department}</p>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Designation / Title</span>
                      <p className="text-sm font-semibold text-slate-900 mt-1">{employeeData.designation}</p>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Employment Status</span>
                      <div className="mt-1">
                        <Badge variant={employeeData.status}>{employeeData.status}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Assigned Working Schedule</span>
                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        {assignedSchedule ? `${assignedSchedule.name} (${assignedSchedule.totalWorkingHours || 40}h / week)` : "No schedule assigned"}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 space-y-1.5 shadow-2xs">
                      <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        <span>Working Hours Policy</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Assigned schedule dictates expected standard hours for automated attendance validation and payroll processing calculations.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdateEmployee} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                        <Combobox
                          options={departmentOptions}
                          value={currentForm.department}
                          onChange={(val) => setFormData({ ...currentForm, department: val || "Engineering" })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Designation / Title</label>
                        <input
                          type="text"
                          required
                          value={currentForm.designation}
                          onChange={(e) => setFormData({ ...currentForm, designation: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Status</label>
                        <select
                          value={currentForm.status}
                          onChange={(e) => setFormData({ ...currentForm, status: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="RESIGNED">Resigned</option>
                          <option value="TERMINATED">Terminated</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Working Schedule</label>
                        <Combobox
                          options={scheduleOptions}
                          value={currentForm.workingWeeklyScheduleId || ""}
                          onChange={(val) => setFormData({ ...currentForm, workingWeeklyScheduleId: val })}
                          placeholder="Select Working Schedule"
                        />
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                        <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-indigo-600" />
                          <span>Payroll & Attendance Alignment</span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Click Save Changes above to commit updates to the master employee record.
                        </p>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === "contracts" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Employment Contracts History</h3>
                <button
                  onClick={() => setIsContractModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Contract</span>
                </button>
              </div>

              {contractsList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                  No contracts created for this employee yet. Create a contract to enable payroll processing.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                      <tr>
                        <th className="px-4 py-3">Contract Name</th>
                        <th className="px-4 py-3">Start Date</th>
                        <th className="px-4 py-3">End Date</th>
                        <th className="px-4 py-3">Base Salary Wage</th>
                        <th className="px-4 py-3">Validity</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {contractsList.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3 font-semibold text-slate-800">{c.name}</td>
                          <td className="px-4 py-3 text-slate-600">{c.startDate}</td>
                          <td className="px-4 py-3 text-slate-600">{c.endDate || "Indefinite"}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">
                            ₹{Number(c.salary).toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 text-slate-500">{c.validity}</td>
                          <td className="px-4 py-3">
                            <Badge variant={c.status}>{c.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Attendance Log History</h3>
              {attendanceList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                  No attendance records recorded for this employee.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Check In</th>
                        <th className="px-4 py-3">Check Out</th>
                        <th className="px-4 py-3">Worked Hours</th>
                        <th className="px-4 py-3">Overtime</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendanceList.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3 font-semibold text-slate-800">{a.date}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {a.checkIn ? new Date(a.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {a.checkOut ? new Date(a.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "In Progress"}
                          </td>
                          <td className="px-4 py-3 text-slate-800 font-medium">{a.workedHours || 0} hrs</td>
                          <td className="px-4 py-3 text-indigo-600 font-medium">{a.overtimeHours || 0} hrs</td>
                          <td className="px-4 py-3">
                            <Badge variant={a.status}>{a.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "timeoff" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">Leave Allocations</h3>
                {allocationsList.length === 0 ? (
                  <div className="p-4 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                    No leave allocations assigned.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {allocationsList.map((al) => (
                      <div key={al.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-slate-800 text-xs">{al.typeName || "Leave"}</span>
                          <Badge variant={al.status}>{al.status}</Badge>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-slate-900">{al.remainingDays}</span>
                          <span className="text-xs text-slate-500">/ {al.allocatedDays} Days Remaining</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">Taken: {al.takenDays} Days • Year {al.validityYear}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">Time Off Requests</h3>
                {timeOffList.length === 0 ? (
                  <div className="p-4 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                    No leave requests found.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                        <tr>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Start Date</th>
                          <th className="px-4 py-3">End Date</th>
                          <th className="px-4 py-3">Reason</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {timeOffList.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/60">
                            <td className="px-4 py-3 font-semibold text-slate-800">{t.typeName || "Leave"}</td>
                            <td className="px-4 py-3 text-slate-600">{new Date(t.startDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-slate-600">{new Date(t.endDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-slate-600">{t.reason}</td>
                            <td className="px-4 py-3">
                              <Badge variant={t.status}>{t.status}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        title="Add Employment Contract"
      >
        <form onSubmit={handleCreateContract} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Name / Title</label>
            <input
              type="text"
              required
              value={newContractData.name}
              onChange={(e) => setNewContractData({ ...newContractData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={newContractData.startDate}
                onChange={(e) => setNewContractData({ ...newContractData, startDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date (Optional)</label>
              <input
                type="date"
                value={newContractData.endDate}
                onChange={(e) => setNewContractData({ ...newContractData, endDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Base Wage (Annual/Period)</label>
              <input
                type="number"
                required
                value={newContractData.salary}
                onChange={(e) => setNewContractData({ ...newContractData, salary: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Validity Year</label>
              <input
                type="number"
                required
                value={newContractData.validity}
                onChange={(e) => setNewContractData({ ...newContractData, validity: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={newContractData.status}
              onChange={(e) => setNewContractData({ ...newContractData, status: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsContractModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createContractMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg cursor-pointer disabled:opacity-50"
            >
              {createContractMutation.isPending ? "Creating..." : "Create Contract"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
