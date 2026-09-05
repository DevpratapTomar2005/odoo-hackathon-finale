import React from "react";
import { cn } from "../../utils/cn.js";

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = "indigo", className = "" }) {
  const colorMap = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    sky: "bg-sky-50 text-sky-600 border-sky-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        {Icon && (
          <div className={cn("p-2.5 rounded-lg border", colorMap[color] || colorMap.indigo)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        {trend && (
          <p
            className={cn(
              "mt-2 text-xs font-medium flex items-center gap-1",
              trend.positive ? "text-emerald-600" : "text-rose-600"
            )}
          >
            <span>{trend.positive ? "↑" : "↓"}</span>
            <span>{trend.text}</span>
          </p>
        )}
      </div>
    </div>
  );
}
