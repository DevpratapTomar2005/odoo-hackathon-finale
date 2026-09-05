import React from "react";
import { cn } from "../../utils/cn.js";

export function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-slate-100 text-slate-800 border-slate-200",
    primary: "bg-indigo-50 text-indigo-700 border-indigo-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    EXPIRED: "bg-slate-100 text-slate-600 border-slate-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
    PRESENT: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ABSENT: "bg-rose-50 text-rose-700 border-rose-200",
    DRAFT: "bg-slate-100 text-slate-700 border-slate-300",
    COMPUTED: "bg-sky-50 text-sky-700 border-sky-200",
    VALIDATED: "bg-indigo-50 text-indigo-700 border-indigo-200",
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
    BLUE: "bg-blue-50 text-blue-700 border-blue-200",
    GREEN: "bg-emerald-50 text-emerald-700 border-emerald-200",
    RED: "bg-rose-50 text-rose-700 border-rose-200",
    ORANGE: "bg-amber-50 text-amber-700 border-amber-200",
  };

  const selectedVariant = variants[variant] || variants.default;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        selectedVariant,
        className
      )}
    >
      {children}
    </span>
  );
}
