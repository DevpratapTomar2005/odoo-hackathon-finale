import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { logout } from "../../store/slices/authSlice.js";
import { addToast, toggleSidebar } from "../../store/slices/uiSlice.js";
import { authService } from "../../services/api/auth.service.js";
import { Badge } from "./Badge.jsx";
import { AttendanceWidget } from "./AttendanceWidget.jsx";
import { useAttendanceByEmployee } from "../../hooks/useAttendence.js";
import { useMyProfile } from "../../hooks/useEmployee.js";
import { fullName, toTitleCase } from "../../utils/format.js";
import {
  Menu,
  LogOut,
  User,
  Building2,
  ChevronDown,
  Clock,
  CheckCircle2,
} from "lucide-react";

export function Header() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);

  const { data: profileRes } = useMyProfile();
  const profile = profileRes?.data;
  const { data: attRes } = useAttendanceByEmployee(profile?.id);
  const attendanceLogs = attRes?.data || [];
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecord = attendanceLogs.find((a) => a.date?.startsWith(todayStr)) || null;
  const isClockedIn = !!todayRecord?.checkIn && !todayRecord?.checkOut;

  const attendanceRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (attendanceRef.current && !attendanceRef.current.contains(e.target)) {
        setAttendanceOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
    } finally {
      dispatch(logout());
      dispatch(addToast({ type: "info", title: "Logged Out", message: "You have been signed out." }));
      navigate("/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="flex items-center gap-4">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors md:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-base">PeoplePay360</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                ERP
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={attendanceRef}>
          <button
            onClick={() => setAttendanceOpen(!attendanceOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isClockedIn
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs"
                : todayRecord?.checkOut
                ? "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 shadow-2xs"
            }`}
          >
            <span className="flex h-2 w-2 relative">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isClockedIn ? "bg-emerald-400" : "bg-amber-400"
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isClockedIn ? "bg-emerald-500" : "bg-amber-500"
                }`}
              ></span>
            </span>
            <Clock className="w-4 h-4" />
            <span className="hidden md:inline">
              {isClockedIn ? "Clocked In" : todayRecord?.checkOut ? "Shift Completed" : "Mark Attendance"}
            </span>
          </button>

          {attendanceOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Attendance Panel</h4>
                    <p className="text-[10px] text-slate-500">Live shift tracking</p>
                  </div>
                </div>
                <Badge variant={isClockedIn ? "success" : "warning"}>
                  {isClockedIn ? "Working" : todayRecord?.checkOut ? "Completed" : "Off Duty"}
                </Badge>
              </div>

              <AttendanceWidget />
            </div>
          )}
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center text-sm border border-indigo-200">
              {user?.firstName ? user.firstName[0].toUpperCase() : "U"}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold text-slate-800 leading-none">
                {fullName(user?.firstName, user?.lastName)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1 capitalize font-medium">
                {user?.role?.replace("_", " ")}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">
                  {fullName(user?.firstName, user?.lastName)}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1.5">
                  <Badge variant={user?.role === "ADMIN" ? "purple" : "primary"}>
                    {user?.role}
                  </Badge>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate("/portal");
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile & Portal</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
