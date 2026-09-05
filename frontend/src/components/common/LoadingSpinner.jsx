import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn.js";

export function LoadingSpinner({ size = "md", text = "Loading...", className = "" }) {
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-slate-500 gap-3", className)}>
      <Loader2 className={cn("animate-spin text-indigo-600", sizeMap[size])} />
      {text && <p className="text-xs font-medium text-slate-500">{text}</p>}
    </div>
  );
}
