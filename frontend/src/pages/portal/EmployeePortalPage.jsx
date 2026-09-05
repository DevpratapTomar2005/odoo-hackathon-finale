import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useMyProfile } from "../../hooks/useEmployee.js";
import { useAttendanceByEmployee } from "../../hooks/useAttendence.js";
import {
  useAllocationsByEmployee,
  useTimeoffRequestsByEmployee,
  useTimeoffTypes,
  useCreateTimeoffRequest,
} from "../../hooks/useTimeOffAndAllocations.js";
import { usePayslipsByEmployee } from "../../hooks/usePayroll.js";
import { payrollService } from "../../services/api/payroll.service.js";
import { Badge } from "../../components/common/Badge.jsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Pagination } from "../../components/common/Pagination.jsx";
import { Combobox } from "../../components/common/Combobox.jsx";
import { AttendanceWidget } from "../../components/common/AttendanceWidget.jsx";
import { addToast } from "../../store/slices/uiSlice.js";
import { fullName, toTitleCase } from "../../utils/format.js";
import {
  Download,
  Plus,
  Building2,
  Briefcase,
} from "lucide-react";

export function EmployeePortalPage() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const { data: meRes, isLoading: meLoading } = useMyProfile();
  const profile = meRes?.data;

  const { data: attRes } = useAttendanceByEmployee(profile?.id);
  const { data: allocRes } = useAllocationsByEmployee(profile?.id);
  const { data: timeoffRes } = useTimeoffRequestsByEmployee(profile?.id);
  const { data: payslipsRes } = usePayslipsByEmployee(profile?.id);
  const { data: typesRes } = useTimeoffTypes();

  const createRequestMutation = useCreateTimeoffRequest();

  const attendanceLogs = attRes?.data || [];
  const allocations = allocRes?.data || [];
  const timeOffRequests = timeoffRes?.data || [];
  const payslips = payslipsRes?.data || [];
  const types = typesRes?.data || [];

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestData, setRequestData] = useState({
    timeoffType: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    reason: "",
  });

  const [attPage, setAttPage] = useState(1);
  const [attPageSize, setAttPageSize] = useState(5);

  const [slipPage, setSlipPage] = useState(1);
  const [slipPageSize, setSlipPageSize] = useState(5);

  const paginatedLogs = useMemo(() => {
    const start = (attPage - 1) * attPageSize;
    return attendanceLogs.slice(start, start + attPageSize);
  }, [attendanceLogs, attPage, attPageSize]);

  const paginatedPayslips = useMemo(() => {
    const start = (slipPage - 1) * slipPageSize;
    return payslips.slice(start, start + slipPageSize);
  }, [payslips, slipPage, slipPageSize]);

  const typeOptions = useMemo(() => {
    return types.map((t) => ({
      value: t.id,
      label: t.name,
      sublabel: `Unit: ${t.unit} • ${t.allocationNeed}`,
    }));
  }, [types]);

  const handleSubmitTimeOff = (e) => {
    e.preventDefault();
    if (!profile?.id || !requestData.timeoffType) {
      dispatch(addToast({ type: "error", title: "Missing Information", message: "Please select a leave policy." }));
      return;
    }

    createRequestMutation.mutate(
      {
        employeeId: profile.id,
        data: {
          startDate: requestData.startDate,
          endDate: requestData.endDate,
          timeoffType: requestData.timeoffType,
          reason: requestData.reason,
        },
      },
      {
        onSuccess: () => {
          dispatch(addToast({ type: "success", title: "Request Submitted", message: "Time off request queued for manager approval." }));
          setIsRequestModalOpen(false);
          setRequestData({
            timeoffType: "",
            startDate: new Date().toISOString().slice(0, 10),
            endDate: new Date().toISOString().slice(0, 10),
            reason: "",
          });
        },
        onError: (err) => {
          dispatch(addToast({ type: "error", title: "Submission Failed", message: err.message }));
        },
      }
    );
  };

  if (meLoading || !profile) {
    return <LoadingSpinner text="Loading employee self-service portal..." />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold flex items-center justify-center text-2xl shadow-md shadow-indigo-500/20">
            {user?.firstName ? user.firstName[0] : "E"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {fullName(user?.firstName, user?.lastName)}
              </h1>
              <span className="font-mono text-xs text-slate-400">#{profile.employeeId}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>{toTitleCase(profile.designation)}</span>
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{toTitleCase(profile.department)}</span>
              </span>
            </p>
          </div>
        </div>

        <AttendanceWidget />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">My Leave Balances</h3>
              <button
                onClick={() => {
                  setRequestData({
                    timeoffType: types[0]?.id || "",
                    startDate: new Date().toISOString().slice(0, 10),
                    endDate: new Date().toISOString().slice(0, 10),
                    reason: "",
                  });
                  setIsRequestModalOpen(true);
                }}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Apply Leave</span>
              </button>
            </div>

            {allocations.length === 0 ? (
              <p className="text-xs text-slate-400">No allocated leave balances assigned.</p>
            ) : (
              <div className="space-y-3">
                {allocations.map((al) => (
                  <div key={al.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800">{al.typeName || "Leave"}</span>
                      <span className="font-bold text-emerald-700">{al.remainingDays} Days Left</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${Math.round(((al.remainingDays || 0) / (al.allocatedDays || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Taken: {al.takenDays} Days</span>
                      <span>Total: {al.allocatedDays} Days</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-800">My Leave Requests</h3>
            {timeOffRequests.length === 0 ? (
              <p className="text-xs text-slate-400">No leave requests submitted.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {timeOffRequests.map((req) => (
                  <div key={req.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-slate-800">{req.typeName || "Leave"}</span>
                      <Badge variant={req.status}>{req.status}</Badge>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {new Date(req.startDate).toLocaleDateString()} → {new Date(req.endDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">My Historical Payslips</h3>
            {payslips.length === 0 ? (
              <p className="text-xs text-slate-400">No finalized payslips available yet.</p>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
                    <tr>
                      <th className="px-4 py-3">Gross Salary</th>
                      <th className="px-4 py-3">Net Salary</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {paginatedPayslips.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          ₹{Number(p.grossSalary || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-700">
                          ₹{Number(p.netSalary || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={p.status}>{p.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => payrollService.downloadPayslipPdf(p.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <Pagination
                  currentPage={slipPage}
                  totalItems={payslips.length}
                  pageSize={slipPageSize}
                  pageSizeOptions={[5, 10, 20]}
                  onPageChange={setSlipPage}
                  onPageSizeChange={(s) => {
                    setSlipPageSize(s);
                    setSlipPage(1);
                  }}
                />
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Recent Attendance Logs</h3>
            {attendanceLogs.length === 0 ? (
              <p className="text-xs text-slate-400">No attendance records logged.</p>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Check In</th>
                      <th className="px-4 py-3">Check Out</th>
                      <th className="px-4 py-3">Worked Hours</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {paginatedLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-mono font-semibold text-slate-800">{log.date}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{log.workedHours || 0} hrs</td>
                        <td className="px-4 py-3">
                          <Badge variant={log.status}>{log.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <Pagination
                  currentPage={attPage}
                  totalItems={attendanceLogs.length}
                  pageSize={attPageSize}
                  pageSizeOptions={[5, 10, 20]}
                  onPageChange={setAttPage}
                  onPageSizeChange={(s) => {
                    setAttPageSize(s);
                    setAttPage(1);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Apply for Time Off"
      >
        <form onSubmit={handleSubmitTimeOff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Policy</label>
            <Combobox
              options={typeOptions}
              value={requestData.timeoffType}
              onChange={(val) => setRequestData({ ...requestData, timeoffType: val })}
              placeholder="Search Leave Policy..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={requestData.startDate}
                onChange={(e) => setRequestData({ ...requestData, startDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={requestData.endDate}
                onChange={(e) => setRequestData({ ...requestData, endDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason</label>
            <textarea
              required
              rows={3}
              value={requestData.reason}
              onChange={(e) => setRequestData({ ...requestData, reason: e.target.value })}
              placeholder="State reason for absence..."
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
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
            >
              {createRequestMutation.isPending ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
