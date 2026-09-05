import React from "react";
import { NavLink } from "react-router";
import { useSelector } from "react-redux";
import { cn } from "../../utils/cn.js";
import {
  LayoutDashboard,
  Users,
  FileText,
  CalendarCheck,
  CalendarOff,
  Banknote,
  Sliders,
  CalendarDays,
  UserCheck,
} from "lucide-react";

export function Sidebar() {
  const { user } = useSelector((state) => state.auth);
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);

  const role = user?.role || "EMPLOYEE";
  const isAdmin = role === "ADMIN";
  const isHRManager = ["HR_MANAGER", "ADMIN"].includes(role);
  const isHRStaff = ["HR_MANAGER", "HR_PAYROLL", "PAYROLL_ADMIN", "ADMIN"].includes(role);
  const isPayrollStaff = ["HR_PAYROLL", "PAYROLL_ADMIN", "ADMIN"].includes(role);
  const isPayrollAdmin = ["PAYROLL_ADMIN", "ADMIN"].includes(role);

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      show: isHRStaff,
    },
    {
      label: "Employees",
      path: "/employees",
      icon: Users,
      show: isHRStaff,
    },
    {
      label: "Contracts",
      path: "/contracts",
      icon: FileText,
      show: isHRStaff,
    },
    {
      label: "Attendance",
      path: "/attendance",
      icon: CalendarCheck,
      show: isHRStaff,
    },
    {
      label: "Time Off",
      path: "/timeoff",
      icon: CalendarOff,
      show: isHRStaff,
    },
    {
      label: "Payroll & Payruns",
      path: "/payroll",
      icon: Banknote,
      show: isPayrollStaff,
    },
    {
      label: "Salary Structures",
      path: "/payroll/structures",
      icon: Sliders,
      show: isPayrollStaff,
    },
    {
      label: "Working Schedules",
      path: "/schedules",
      icon: CalendarDays,
      show: isHRStaff,
    },
    {
      label: "My Employee Portal",
      path: "/portal",
      icon: UserCheck,
      show: true,
    },
  ];

  const visibleNav = navItems.filter((i) => i.show);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transition-transform duration-200 ease-in-out md:translate-x-0 flex flex-col pt-16 border-r border-slate-800",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
        <div className="px-3 pb-3 text-[11px] font-bold tracking-wider uppercase text-slate-500">
          Navigation
        </div>

        {visibleNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/payroll" || item.path === "/dashboard"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group",
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                    )}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
            {role.slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] text-slate-400 truncate capitalize">
              {role.toLowerCase().replace("_", " ")}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
