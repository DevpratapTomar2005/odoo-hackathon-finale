import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { removeToast } from "../../store/slices/uiSlice.js";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "../../utils/cn.js";

export function ToastContainer() {
  const toasts = useSelector((state) => state.ui.toasts);
  const dispatch = useDispatch();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dispatch(removeToast(toast.id))} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(onDismiss, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
  };

  const borders = {
    success: "border-emerald-200 bg-white text-slate-800",
    error: "border-rose-200 bg-white text-slate-800",
    warning: "border-amber-200 bg-white text-slate-800",
    info: "border-sky-200 bg-white text-slate-800",
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all animate-in slide-in-from-bottom-5 duration-200",
        borders[toast.type] || borders.info
      )}
    >
      {icons[toast.type] || icons.info}
      <div className="flex-1">
        {toast.title && <h5 className="text-sm font-semibold">{toast.title}</h5>}
        {toast.message && <p className="text-xs text-slate-600 mt-0.5">{toast.message}</p>}
      </div>
      <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 p-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
