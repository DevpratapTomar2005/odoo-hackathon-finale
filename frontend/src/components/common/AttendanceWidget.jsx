import React, { useState, useEffect } from "react";
import { Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAttendanceByEmployee, useCheckIn, useCheckOut } from "../../hooks/useAttendence.js";
import { useMyProfile } from "../../hooks/useEmployee.js";
import { useDispatch } from "react-redux";
import { addToast } from "../../store/slices/uiSlice.js";
import { cn } from "../../utils/cn.js";

export function AttendanceWidget({ className = "" }) {
  const dispatch = useDispatch();
  const { data: profileRes, isLoading: profileLoading } = useMyProfile();
  const profile = profileRes?.data;

  const { data: attRes, isLoading: attLoading } = useAttendanceByEmployee(profile?.id);
  const attendanceLogs = attRes?.data || [];

  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecord = attendanceLogs.find((a) => a.date?.startsWith(todayStr)) || null;

  const [elapsedTime, setElapsedTime] = useState("00:00:00");

  useEffect(() => {
    if (!todayRecord?.checkIn || todayRecord?.checkOut) {
      setElapsedTime("00:00:00");
      return;
    }

    const updateTimer = () => {
      const start = new Date(todayRecord.checkIn).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, now - start);

      const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
      const minutes = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0");
      const seconds = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, "0");
      setElapsedTime(`${hours}:${minutes}:${seconds}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [todayRecord?.checkIn, todayRecord?.checkOut]);

  const handleClockIn = () => {
    if (!profile?.id) return;
    checkInMutation.mutate(profile.id, {
      onSuccess: () => {
        dispatch(addToast({ type: "success", title: "Checked In", message: "Your attendance is marked as Present." }));
      },
      onError: (err) => {
        dispatch(addToast({ type: "error", title: "Check-in Failed", message: err.message }));
      },
    });
  };

  const handleClockOut = () => {
    if (!todayRecord?.id) return;
    checkOutMutation.mutate(
      { attendanceId: todayRecord.id, data: { overtimeHours: 0 } },
      {
        onSuccess: () => {
          dispatch(addToast({ type: "success", title: "Checked Out", message: "Check-out time recorded successfully." }));
        },
        onError: (err) => {
          dispatch(addToast({ type: "error", title: "Check-out Failed", message: err.message }));
        },
      }
    );
  };

  if (profileLoading || !profile) return null;

  const isPending = checkInMutation.isPending || checkOutMutation.isPending || attLoading;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {!todayRecord?.checkIn ? (
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1 shadow-2xs">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">Not Checked In</span>
          <button
            type="button"
            disabled={isPending}
            onClick={handleClockIn}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )}
            <span>Clock In</span>
          </button>
        </div>
      ) : !todayRecord?.checkOut ? (
        <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200 rounded-xl px-2.5 py-1 shadow-2xs">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase font-bold text-emerald-800 leading-none">In Progress</span>
            <span className="font-mono text-xs font-bold text-emerald-700 leading-tight">{elapsedTime}</span>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={handleClockOut}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50 ml-1"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>Clock Out</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">Today's Shift</span>
            <span className="text-xs font-semibold text-slate-800 leading-tight">
              {todayRecord.workedHours || 0} hrs worked
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
