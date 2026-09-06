import React, { useState } from "react";
import { useWeeklySchedules, useCreateWeeklySchedule, useDeleteWeeklySchedule } from "../../hooks/useSchedules.js";
import { Badge } from "../../components/common/Badge.jsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { useDispatch } from "react-redux";
import { addToast } from "../../store/slices/uiSlice.js";
import { CalendarDays, Plus, Trash2 } from "lucide-react";

export function SchedulesPage() {
  const { data: schedRes, isLoading: schedLoading } = useWeeklySchedules();
  const schedules = schedRes?.data?.schedules || [];

  const createScheduleMutation = useCreateWeeklySchedule();
  const deleteScheduleMutation = useDeleteWeeklySchedule();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduleName, setScheduleName] = useState("Standard Shift");
  const [daysState, setDaysState] = useState([
    { day: "MONDAY", enabled: true, startTime: "09:00", endTime: "17:00", breakMinutes: 60, dayHours: 8 },
    { day: "TUESDAY", enabled: true, startTime: "09:00", endTime: "17:00", breakMinutes: 60, dayHours: 8 },
    { day: "WEDNESDAY", enabled: true, startTime: "09:00", endTime: "17:00", breakMinutes: 60, dayHours: 8 },
    { day: "THURSDAY", enabled: true, startTime: "09:00", endTime: "17:00", breakMinutes: 60, dayHours: 8 },
    { day: "FRIDAY", enabled: true, startTime: "09:00", endTime: "17:00", breakMinutes: 60, dayHours: 8 },
    { day: "SATURDAY", enabled: false, startTime: "09:00", endTime: "13:00", breakMinutes: 0, dayHours: 4 },
    { day: "SUNDAY", enabled: false, startTime: "09:00", endTime: "17:00", breakMinutes: 0, dayHours: 0 },
  ]);

  const dispatch = useDispatch();

  const totalCalculatedHours = daysState
    .filter((d) => d.enabled)
    .reduce((acc, d) => acc + Number(d.dayHours || 0), 0);

  const activeDaysCount = daysState.filter((d) => d.enabled).length;

  const handleDayToggle = (idx) => {
    const updated = [...daysState];
    updated[idx].enabled = !updated[idx].enabled;
    setDaysState(updated);
  };

  const handleDayChange = (idx, field, value) => {
    const updated = [...daysState];
    updated[idx][field] = value;
    setDaysState(updated);
  };

  const handleCreateSchedule = (e) => {
    e.preventDefault();

    if (!scheduleName.trim()) {
      dispatch(addToast({ type: "error", title: "Missing Name", message: "Please enter a schedule template name." }));
      return;
    }

    const activeDays = daysState.filter((d) => d.enabled);
    if (activeDays.length === 0) {
      dispatch(addToast({ type: "error", title: "No Days Active", message: "Enable at least one working day." }));
      return;
    }

    for (const d of activeDays) {
      if (!d.startTime || !d.endTime) {
        dispatch(addToast({ type: "error", title: "Missing Time", message: `Please set start and end time for ${d.day}.` }));
        return;
      }
      if (d.endTime <= d.startTime) {
        dispatch(addToast({ type: "error", title: "Invalid Time Range", message: `End time must be after start time for ${d.day}.` }));
        return;
      }
      const dayHoursNum = Number(d.dayHours);
      if (d.dayHours === "" || Number.isNaN(dayHoursNum) || dayHoursNum <= 0 || dayHoursNum > 24) {
        dispatch(addToast({ type: "error", title: "Invalid Hours", message: `Daily hours for ${d.day} must be a number between 0 and 24.` }));
        return;
      }
      const breakMinutesNum = Number(d.breakMinutes);
      if (d.breakMinutes === "" || Number.isNaN(breakMinutesNum) || breakMinutesNum < 0) {
        dispatch(addToast({ type: "error", title: "Invalid Break Minutes", message: `Break minutes for ${d.day} must be 0 or more.` }));
        return;
      }
    }

    const payload = {
      name: scheduleName,
      workingDays: activeDays.length,
      workingHours: activeDays[0] ? Number(activeDays[0].dayHours) : 8,
      dailySchedule: activeDays.map((d) => ({
        day: d.day,
        startTime: d.startTime,
        endTime: d.endTime,
        breakMinutes: Number(d.breakMinutes),
        dayHours: Number(d.dayHours),
      })),
      startTime: activeDays[0]?.startTime || "09:00",
      endTime: activeDays[0]?.endTime || "17:00",
      breakMinutes: Number(activeDays[0]?.breakMinutes || 60),
      dayHours: Number(activeDays[0]?.dayHours || 8),
    };

    createScheduleMutation.mutate(payload, {
      onSuccess: () => {
        dispatch(addToast({ type: "success", title: "Schedule Created", message: "Working schedule template registered." }));
        setIsModalOpen(false);
      },
      onError: (err) => {
        dispatch(addToast({ type: "error", title: "Creation Failed", message: err.message }));
      },
    });
  };

  const handleDeleteSchedule = (id) => {
    if (!window.confirm("Are you sure you want to delete this schedule?")) return;
    deleteScheduleMutation.mutate(id, {
      onSuccess: () => {
        dispatch(addToast({ type: "info", title: "Deleted", message: "Schedule removed." }));
      },
      onError: (err) => {
        dispatch(addToast({ type: "error", title: "Deletion Failed", message: err.message }));
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Working Schedule Setup</h1>
          <p className="text-xs text-slate-500 mt-0.5">Define weekly working shifts, shift intervals, daily hours, and automated weekly hours calculation</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Working Schedule</span>
        </button>
      </div>

      {schedLoading ? (
        <LoadingSpinner text="Fetching schedule patterns..." />
      ) : schedules.length === 0 ? (
        <EmptyState
          title="No working schedules created"
          description="Create standard shift patterns to link with employee profiles and attendance tracking."
          icon={CalendarDays}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((s) => (
            <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{s.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{s.workingDays} Active Days per week</p>
                </div>
                <button
                  onClick={() => handleDeleteSchedule(s.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Daily Hours</span>
                  <span className="text-base font-bold text-slate-800">{s.workingHours} hrs/day</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Weekly</span>
                  <span className="text-base font-bold text-indigo-600">{s.totalWorkingHours || s.workingHours * s.workingDays} hrs/wk</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Working Schedule Builder"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateSchedule} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Schedule Template Name</label>
            <input
              type="text"
              required
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              placeholder="e.g. Standard Engineering 40h Shift"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700">Weekly Pattern Builder</label>
              <span className="text-xs font-bold text-indigo-600">
                Weekly Total: {totalCalculatedHours} hrs ({activeDaysCount} Days)
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
              {daysState.map((d, idx) => (
                <div
                  key={d.day}
                  className={`p-2.5 rounded-lg border transition-all flex items-center gap-3 ${d.enabled ? "bg-white border-slate-200 shadow-2xs" : "bg-slate-100/60 border-transparent opacity-60"}`}
                >
                  <input
                    type="checkbox"
                    checked={d.enabled}
                    onChange={() => handleDayToggle(idx)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-xs text-slate-800 w-24">{d.day}</span>

                  {d.enabled && (
                    <div className="flex items-center gap-2 flex-1 text-xs">
                      <input
                        type="time"
                        value={d.startTime}
                        onChange={(e) => handleDayChange(idx, "startTime", e.target.value)}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                      />
                      <span className="text-slate-400">→</span>
                      <input
                        type="time"
                        value={d.endTime}
                        onChange={(e) => handleDayChange(idx, "endTime", e.target.value)}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                      />
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-[10px] text-slate-400">Hours:</span>
                        <input
                          type="number"
                          step="0.5"
                          value={d.dayHours}
                          onChange={(e) => handleDayChange(idx, "dayHours", e.target.value)}
                          className="w-14 px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-800 text-center"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
              disabled={createScheduleMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
            >
              {createScheduleMutation.isPending ? "Saving..." : "Save Schedule"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}